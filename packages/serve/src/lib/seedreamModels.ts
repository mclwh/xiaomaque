import { env } from "../config/env.js";

// SeedreamModelId 前端生图模型 ID
export type SeedreamModelId = "seedream-5.0" | "seedream-4.5";

// SeedreamAspectRatioId 输出比例 ID
export type SeedreamAspectRatioId =
    | "auto"
    | "16:9"
    | "21:9"
    | "9:16"
    | "4:3"
    | "3:4"
    | "1:1";

// SeedreamResolution 输出清晰度
export type SeedreamResolution = "3K" | "4K";

// SEEDREAM_MODEL_IDS 支持的模型 ID 列表
export const SEEDREAM_MODEL_IDS = ["seedream-5.0", "seedream-4.5"] as const;

// SEEDREAM_ASPECT_RATIO_IDS 支持的比例 ID 列表
export const SEEDREAM_ASPECT_RATIO_IDS = [
    "auto",
    "16:9",
    "21:9",
    "9:16",
    "4:3",
    "3:4",
    "1:1",
] as const;

// SEEDREAM_RESOLUTIONS 支持的清晰度列表
export const SEEDREAM_RESOLUTIONS = ["3K", "4K"] as const;

// SEEDREAM_MODEL_ENDPOINT_MAP 前端模型 ID 到火山方舟 endpoint 的映射
const SEEDREAM_MODEL_ENDPOINT_MAP: Record<SeedreamModelId, string> = {
    "seedream-5.0": env.SEEDREAM_MODEL_5_0,
    "seedream-4.5": env.SEEDREAM_MODEL_4_5,
};

/*
 * SEEDREAM_SIZE_MAP 清晰度 + 比例到火山方舟 size 参数的映射
 * auto 时使用分辨率关键词，由模型根据 prompt 推断宽高比
 */
const SEEDREAM_SIZE_MAP: Record<
    SeedreamResolution,
    Record<SeedreamAspectRatioId, string>
> = {
    "3K": {
        auto: "3K",
        "1:1": "3072x3072",
        "16:9": "4096x2304",
        "21:9": "4704x2016",
        "9:16": "2304x4096",
        "4:3": "3456x2592",
        "3:4": "2592x3456",
    },
    "4K": {
        auto: "4K",
        "1:1": "4096x4096",
        "16:9": "5404x3040",
        "21:9": "6198x2656",
        "9:16": "3040x5404",
        "4:3": "4694x3520",
        "3:4": "3520x4694",
    },
};

// 根据前端模型 ID 解析火山方舟 endpoint
export function resolveSeedreamModelEndpoint(modelId: SeedreamModelId): string {
    const endpoint = SEEDREAM_MODEL_ENDPOINT_MAP[modelId];

    if (!endpoint) {
        throw new Error(`未配置模型 ${modelId} 对应的 Seedream endpoint`);
    }

    return endpoint;
}

// 根据清晰度与比例解析火山方舟 size 参数
export function resolveSeedreamSize(
    resolution: SeedreamResolution,
    aspectRatio: SeedreamAspectRatioId,
): string {
    return SEEDREAM_SIZE_MAP[resolution][aspectRatio];
}
