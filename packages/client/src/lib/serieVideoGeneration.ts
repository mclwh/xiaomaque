import type { SerieParams } from "@/api/serie";
import {
    VIDEO_ASPECT_RATIO_OPTIONS,
    VIDEO_GENERATION_MODELS,
    VIDEO_RESOLUTION_OPTIONS,
    type VideoAspectRatioId,
    type VideoResolution,
} from "@/lib/generationOptions";
import { resolveSavedImageStyleId, type ImageStyleId } from "@/lib/imageStyles";
import { parseSerieParams } from "@/lib/serieEpisode";

// SerieVideoGenerationSettings 分集视频生成参数（存于 serie.params.videoGeneration）
export type SerieVideoGenerationSettings = {
    modelId: string;
    aspectRatio: VideoAspectRatioId;
    resolution: VideoResolution;
    videoStyleId?: ImageStyleId;
};

// 从 params 读取视频生成设置
export function readSerieVideoGenerationSettings(params: unknown): SerieVideoGenerationSettings | null {
    const videoGeneration = parseSerieParams(params).videoGeneration;

    if (!videoGeneration || typeof videoGeneration !== "object") {
        return null;
    }

    const record = videoGeneration as Record<string, unknown>;

    if (
        typeof record.modelId !== "string" ||
        typeof record.aspectRatio !== "string" ||
        typeof record.resolution !== "string"
    ) {
        return null;
    }

    return {
        modelId: record.modelId,
        aspectRatio: record.aspectRatio as VideoAspectRatioId,
        resolution: record.resolution as VideoResolution,
        videoStyleId: resolveSavedImageStyleId(
            typeof record.videoStyleId === "string" ? record.videoStyleId : undefined,
        ),
    };
}

// 解析已保存的视频模型 ID
export function resolveSavedVideoModelId(modelId: string | undefined): string {
    const matchedModel = VIDEO_GENERATION_MODELS.find((option) => option.id === modelId);

    return matchedModel?.id ?? VIDEO_GENERATION_MODELS[0]?.id ?? "seedance-2";
}

// 解析已保存的视频比例
export function resolveSavedVideoAspectRatio(aspectRatio: string | undefined): VideoAspectRatioId {
    const allowedRatios = VIDEO_ASPECT_RATIO_OPTIONS.map((option) => option.id);

    if (aspectRatio && allowedRatios.includes(aspectRatio as VideoAspectRatioId)) {
        return aspectRatio as VideoAspectRatioId;
    }

    return "9:16";
}

// 解析已保存的视频分辨率
export function resolveSavedVideoResolution(resolution: string | undefined): VideoResolution {
    if (resolution && VIDEO_RESOLUTION_OPTIONS.includes(resolution as VideoResolution)) {
        return resolution as VideoResolution;
    }

    return "480p";
}

// 从 params 读取视频生成设置并解析默认值
export function resolveSerieVideoGenerationDefaults(params: unknown): SerieVideoGenerationSettings {
    const saved = readSerieVideoGenerationSettings(params);

    return {
        modelId: resolveSavedVideoModelId(saved?.modelId),
        aspectRatio: resolveSavedVideoAspectRatio(saved?.aspectRatio),
        resolution: resolveSavedVideoResolution(saved?.resolution),
        videoStyleId: saved?.videoStyleId,
    };
}

// 合并视频生成参数到 SerieParams
export function buildSerieParamsWithVideoGeneration(
    existingParams: unknown,
    videoGeneration: SerieVideoGenerationSettings,
): SerieParams {
    const params = parseSerieParams(existingParams);

    return {
        ...params,
        videoGeneration,
    };
}
