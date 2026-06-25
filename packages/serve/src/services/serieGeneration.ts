import { prisma } from "../config/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import { assertProjectOwner } from "../lib/projectAccess.js";
import { inferRemoteFileExt } from "../lib/remoteMedia.js";
import { mergeSerieFragmentParams } from "../lib/serieFragmentParams.js";
import type { SeedanceGenerateBody } from "../lib/buildSeedanceGenerateBody.js";
import { serializeSerieFragmentRow } from "../lib/serieFragment.js";
import { qiniuService } from "./qiniu.js";
import { seedanceVideoService, type SeedanceTaskResult } from "./seedance.js";
import {
    getSerieFragmentContextById,
    getSerieFragmentRowById,
} from "./serieFragment.js";
import { serieService } from "./serie.js";

// processingTaskMap 正在转存中的任务，避免重复上传
const processingTaskMap = new Map<string, Promise<SeedanceGenerationFinalizeResult>>();

// SeedanceGenerationFinalizeResult 生成完成后的分镜视频
export type SeedanceGenerationFinalizeResult = {
    fragmentId: number;
    video: string;
};

// SerieGenerationPollResult 轮询接口响应
export type SerieGenerationPollResult = {
    status: SeedanceTaskResult["status"];
    progress?: number;
    message?: string;
    fragment?: ReturnType<typeof serializeSerieFragmentRow>;
};

// 将远程图片下载并上传到七牛
async function uploadRemoteImageToQiniu(remoteImageUrl: string): Promise<string> {
    const imageResponse = await fetch(remoteImageUrl);

    if (!imageResponse.ok) {
        throw new Error("下载尾帧图片失败");
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const ext = inferRemoteFileExt(imageResponse.headers.get("content-type"), remoteImageUrl);
    const image = await qiniuService.uploadBuffer(
        "image",
        imageBuffer,
        ext,
        imageResponse.headers.get("content-type") ?? "image/jpeg",
    );

    return image.key;
}

// 将 Seedance 临时视频与尾帧转存七牛并更新分镜
async function finalizeSeedanceGeneratedVideo(
    remoteVideoUrl: string,
    remoteLastFrameUrl: string | undefined,
    fragmentId: number,
    durationSec?: number,
): Promise<SeedanceGenerationFinalizeResult> {
    const videoResponse = await fetch(remoteVideoUrl);

    if (!videoResponse.ok) {
        throw new Error("下载生成视频失败");
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const video = await qiniuService.uploadBuffer(
        "video",
        videoBuffer,
        "mp4",
        videoResponse.headers.get("content-type") ?? "video/mp4",
    );

    const fragmentRow = await prisma.serie_fragment.findUnique({
        where: { id: fragmentId },
        select: { params: true },
    });

    let lastFrameKey: string | undefined;

    if (remoteLastFrameUrl) {
        try {
            lastFrameKey = await uploadRemoteImageToQiniu(remoteLastFrameUrl);
        } catch {
            lastFrameKey = undefined;
        }
    }

    const nextParams = mergeSerieFragmentParams(fragmentRow?.params, {
        ...(lastFrameKey ? { lastFrame: lastFrameKey } : {}),
    });

    await prisma.serie_fragment.update({
        where: { id: fragmentId },
        data: {
            video: video.key,
            cover: "",
            params: nextParams,
            ...(typeof durationSec === "number" && durationSec > 0
                ? { duration_sec: durationSec }
                : {}),
        },
    });

    return {
        fragmentId,
        video: video.key,
    };
}

// 提交 Seedance 视频生成任务
export async function submitSerieFragmentSeedanceTask(
    userId: number,
    projectId: number,
    serieId: number,
    fragmentId: number,
    body: SeedanceGenerateBody,
    arkApiKey?: string,
) {
    await assertProjectOwner(userId, projectId);

    const context = await getSerieFragmentContextById(fragmentId);

    if (!context?.fragment || context.projectId !== projectId || context.serieId !== serieId) {
        throw new NotFoundError("分镜不存在");
    }

    const { taskId } = await seedanceVideoService.createTask(body, arkApiKey);

    return {
        taskId,
        fragmentId,
        projectId,
        serieId,
    };
}

// 轮询 Seedance 任务并在成功后回写分镜媒体
export async function pollSerieFragmentSeedanceTask(
    userId: number,
    projectId: number,
    serieId: number,
    fragmentId: number,
    taskId: string,
    arkApiKey?: string,
): Promise<SerieGenerationPollResult> {
    await assertProjectOwner(userId, projectId);

    const context = await getSerieFragmentContextById(fragmentId);

    if (!context?.fragment || context.projectId !== projectId || context.serieId !== serieId) {
        throw new NotFoundError("分镜不存在");
    }

    const fragmentRow = await getSerieFragmentRowById(serieId, fragmentId);

    if (!fragmentRow) {
        throw new NotFoundError("分镜不存在");
    }

    const task = await seedanceVideoService.getTask(taskId, arkApiKey);

    if (task.status === "queued" || task.status === "running") {
        return {
            status: task.status,
            progress: task.progress,
        };
    }

    if (task.status === "failed") {
        return {
            status: "failed",
            message: task.errorMessage ?? "视频生成失败",
        };
    }

    if (!task.videoUrl) {
        return {
            status: "failed",
            message: "视频生成成功但未返回视频地址",
        };
    }

    const finalizePromise =
        processingTaskMap.get(taskId) ??
        finalizeSeedanceGeneratedVideo(
            task.videoUrl,
            task.lastFrameUrl,
            fragmentId,
            task.durationSec,
        ).finally(() => {
            processingTaskMap.delete(taskId);
        });

    processingTaskMap.set(taskId, finalizePromise);
    await finalizePromise;

    const updatedFragment = await getSerieFragmentRowById(serieId, fragmentId);

    if (!updatedFragment) {
        throw new NotFoundError("分镜不存在");
    }

    return {
        status: "succeeded",
        fragment: serializeSerieFragmentRow(updatedFragment),
    };
}

// 轮询成功后拉取完整分集详情（供前端刷新列表）
export async function fetchSerieDetailAfterGeneration(
    userId: number,
    projectId: number,
    serieId: number,
) {
    return serieService.getSerieDetail(userId, projectId, serieId);
}
