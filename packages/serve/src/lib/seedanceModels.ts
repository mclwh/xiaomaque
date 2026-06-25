import { env } from "../config/env.js";

// SeedanceModelId 前端视频模型 ID
export type SeedanceModelId = "seedance-2" | "seedance-2-fast";

// SeedanceRatioId 视频比例
export type SeedanceRatioId = "16:9" | "21:9" | "9:16" | "4:3";

// SeedanceResolution 视频分辨率
export type SeedanceResolution = "480p" | "720p";

// SEEDANCE_MODEL_ENDPOINT_MAP 前端模型 ID 到火山方舟 endpoint 的映射
const SEEDANCE_MODEL_ENDPOINT_MAP: Record<SeedanceModelId, string> = {
    "seedance-2": env.SEEDANCE_MODEL_2_0,
    "seedance-2-fast": env.SEEDANCE_MODEL_2_0_FAST,
};

// 根据前端模型 ID 解析火山方舟 endpoint
export function resolveSeedanceModelEndpoint(modelId: string | undefined): string {
    const normalized = modelId === "seedance-2-fast" ? "seedance-2-fast" : "seedance-2";
    const endpoint = SEEDANCE_MODEL_ENDPOINT_MAP[normalized];

    if (!endpoint) {
        throw new Error(`未配置模型 ${normalized} 对应的 Seedance endpoint`);
    }

    return endpoint;
}

// 解析 Seedance ratio 参数
export function resolveSeedanceRatio(aspectRatio: string | undefined): SeedanceRatioId {
    const allowed: SeedanceRatioId[] = ["16:9", "21:9", "9:16", "4:3"];

    if (aspectRatio && allowed.includes(aspectRatio as SeedanceRatioId)) {
        return aspectRatio as SeedanceRatioId;
    }

    return "9:16";
}

// 解析 Seedance resolution 参数
export function resolveSeedanceResolution(resolution: string | undefined): SeedanceResolution {
    if (resolution === "720p" || resolution === "480p") {
        return resolution;
    }

    return "480p";
}
