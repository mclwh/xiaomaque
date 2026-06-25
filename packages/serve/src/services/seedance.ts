import { arkFetch, parseArkApiError } from "../lib/arkClient.js";
import type { SeedanceGenerateBody } from "../lib/buildSeedanceGenerateBody.js";

// SeedanceTaskStatus Seedance 任务状态
export type SeedanceTaskStatus = "queued" | "running" | "succeeded" | "failed";

// SeedanceTaskResult 查询任务结果
export type SeedanceTaskResult = {
    taskId: string;
    status: SeedanceTaskStatus;
    progress?: number;
    videoUrl?: string;
    lastFrameUrl?: string;
    durationSec?: number;
    errorMessage?: string;
};

// SeedanceApiError 火山方舟错误结构
type SeedanceApiError = {
    error?: {
        message?: string;
        code?: string;
    };
};

// 将 Ark 原始状态映射为统一状态
function normalizeTaskStatus(rawStatus: string | undefined): SeedanceTaskStatus {
    switch (rawStatus) {
        case "queued":
            return "queued";
        case "running":
        case "in_progress":
            return "running";
        case "succeeded":
        case "completed":
            return "succeeded";
        case "failed":
        case "expired":
        case "cancelled":
            return "failed";
        default:
            return "running";
    }
}

/**
 * Seedance 视频生成服务：封装火山方舟 contents/generations/tasks API
 */
export class SeedanceVideoService {
    // 创建视频生成任务
    async createTask(body: SeedanceGenerateBody, apiKeyOverride?: string): Promise<{ taskId: string }> {
        const response = await arkFetch(
            "/contents/generations/tasks",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            },
            apiKeyOverride,
        );

        const payload = (await response.json().catch(() => null)) as
            | ({ id?: string; task_id?: string } & SeedanceApiError)
            | null;

        if (!response.ok) {
            throw new Error(parseArkApiError(payload, response.status, "Seedance"));
        }

        const taskId = payload?.id ?? payload?.task_id;

        if (!taskId) {
            throw new Error("Seedance 未返回任务 ID");
        }

        return { taskId };
    }

    // 查询视频生成任务状态
    async getTask(taskId: string, apiKeyOverride?: string): Promise<SeedanceTaskResult> {
        const response = await arkFetch(
            `/contents/generations/tasks/${taskId}`,
            { method: "GET" },
            apiKeyOverride,
        );

        const payload = (await response.json().catch(() => null)) as
            | ({
                  id?: string;
                  status?: string;
                  progress?: number;
                  duration?: number;
                  content?: { video_url?: string; last_frame_url?: string };
                  error?: { message?: string };
              } & SeedanceApiError)
            | null;

        if (!response.ok) {
            throw new Error(parseArkApiError(payload, response.status, "Seedance"));
        }

        const status = normalizeTaskStatus(payload?.status);
        const videoUrl = payload?.content?.video_url;
        const lastFrameUrl = payload?.content?.last_frame_url;
        const durationSec =
            typeof payload?.duration === "number" && Number.isFinite(payload.duration) && payload.duration > 0
                ? Math.trunc(payload.duration)
                : undefined;

        return {
            taskId,
            status,
            progress: typeof payload?.progress === "number" ? payload.progress : undefined,
            videoUrl: typeof videoUrl === "string" ? videoUrl : undefined,
            lastFrameUrl: typeof lastFrameUrl === "string" ? lastFrameUrl : undefined,
            durationSec,
            errorMessage:
                status === "failed"
                    ? payload?.error?.message ?? "视频生成失败"
                    : undefined,
        };
    }
}

// seedanceVideoService Seedance 视频生成服务单例
export const seedanceVideoService = new SeedanceVideoService();
