// 生成相关选项：模型、清晰度与比例配置

// GenerationModelOption 单个模型选项
export type GenerationModelOption = {
    id: string;
    label: string;
    description: string;
};

// GenerationMediaType 生成媒体类型
export type GenerationMediaType = "image" | "video";

// GenerationResolution 图片可选清晰度
export type GenerationResolution = "3K" | "4K";

// VideoResolution 视频可选分辨率
export type VideoResolution = "480p" | "720p";

// VideoAspectRatioId 视频可选比例
export type VideoAspectRatioId = "16:9" | "21:9" | "9:16" | "4:3";

// VideoSeedMode Seed 模式
export type VideoSeedMode = "random" | "fixed";

// GenerationAspectRatioId 可选比例 ID
export type GenerationAspectRatioId =
    | "auto"
    | "16:9"
    | "21:9"
    | "9:16"
    | "4:3"
    | "3:4"
    | "1:1";

// GENERATION_RESOLUTION_OPTIONS 图片清晰度列表
export const GENERATION_RESOLUTION_OPTIONS: GenerationResolution[] = ["3K", "4K"];

// VIDEO_RESOLUTION_OPTIONS 视频分辨率列表
export const VIDEO_RESOLUTION_OPTIONS: VideoResolution[] = ["480p", "720p"];

// VIDEO_ASPECT_RATIO_OPTIONS 视频比例列表
export const VIDEO_ASPECT_RATIO_OPTIONS: { id: VideoAspectRatioId; label: string }[] = [
    { id: "16:9", label: "16:9" },
    { id: "21:9", label: "21:9" },
    { id: "9:16", label: "9:16" },
    { id: "4:3", label: "4:3" },
];

// VIDEO_DURATION_MIN 视频最短时长（秒）
export const VIDEO_DURATION_MIN = 4;

// VIDEO_DURATION_MAX 视频最长时长（秒）
export const VIDEO_DURATION_MAX = 15;

// GENERATION_ASPECT_RATIO_OPTIONS 比例列表
export const GENERATION_ASPECT_RATIO_OPTIONS: { id: GenerationAspectRatioId; label: string }[] = [
    { id: "auto", label: "自动" },
    { id: "16:9", label: "16:9" },
    { id: "21:9", label: "21:9" },
    { id: "9:16", label: "9:16" },
    { id: "4:3", label: "4:3" },
    { id: "3:4", label: "3:4" },
    { id: "1:1", label: "1:1" },
];

// GENERATION_ASPECT_RATIO_SHAPES 各比例示意图尺寸（px）
export const GENERATION_ASPECT_RATIO_SHAPES: Record<
    GenerationAspectRatioId,
    { width: number; height: number }
> = {
    auto: { width: 28, height: 14 },
    "16:9": { width: 32, height: 18 },
    "21:9": { width: 32, height: 14 },
    "9:16": { width: 14, height: 32 },
    "4:3": { width: 28, height: 21 },
    "3:4": { width: 21, height: 28 },
    "1:1": { width: 24, height: 24 },
};

// IMAGE_GENERATION_MODELS 生图模型列表
export const IMAGE_GENERATION_MODELS: GenerationModelOption[] = [
    {
        id: "seedream-5.0",
        label: "Seedream 5.0",
        description: "更智能的理解与推理，支持联网搜索与多图融合。",
    },
    {
        id: "seedream-4.5",
        label: "Seedream 4.5",
        description: "擅长图片编辑与复杂场景还原，支持 2K/4K 高清输出。",
    },
];

// VIDEO_GENERATION_MODELS 视频模型列表
export const VIDEO_GENERATION_MODELS: GenerationModelOption[] = [
    {
        id: "seedance-2",
        label: "Seedance2.0",
        description: "高质量视频生成，画面更稳定。",
    },
    {
        id: "seedance-2-fast",
        label: "Seedance2.0Fast",
        description: "更快生成速度，适合快速迭代。",
    },
];

// 根据媒体类型返回可选模型
export function getGenerationModelOptions(mediaType: GenerationMediaType) {
    if (mediaType === "video") {
        return VIDEO_GENERATION_MODELS;
    }

    return IMAGE_GENERATION_MODELS;
}

// 格式化输出设置触发按钮文案
export function formatOutputSettingsLabel(
    aspectRatio: GenerationAspectRatioId,
    resolution: GenerationResolution,
    labelMode: "full" | "aspectOnly" = "full",
) {
    const aspectLabel =
        GENERATION_ASPECT_RATIO_OPTIONS.find((option) => option.id === aspectRatio)?.label ?? aspectRatio;

    if (labelMode === "aspectOnly") {
        return aspectLabel;
    }

    return aspectRatio === "auto" ? `自动 · ${resolution}` : `${aspectRatio} · ${resolution}`;
}
