import {
    GENERATION_RESOLUTION_OPTIONS,
    IMAGE_GENERATION_MODELS,
    type GenerationAspectRatioId,
    type GenerationResolution,
} from "@/lib/generationOptions";
import { resolveSavedImageStyleId } from "@/lib/imageStyles";
import {
    readAssetAudioGenerationSettings,
    readAssetCanvasParams,
    readAssetGenerationSettings,
} from "@/lib/assetParams";

// 生图/音频 params 读取与写入已迁移至 lib/assetParams，此处 re-export 保持兼容
export {
    buildAssetParamsWithAudioCharacterBinding,
    buildAssetParamsWithAudioGeneration,
    buildAssetParamsWithGeneration,
    buildAssetParamsWithReferenceSource,
    buildAssetParamsWithVoiceAudio,
    buildAssetParamsWithoutReferenceSource,
    mergeAssetParams,
    patchAssetCanvasParams,
    readAssetAudioCharacterBinding,
    readAssetAudioGenerationSettings,
    readAssetCanvasParams,
    readAssetGenerationSettings,
    readAssetParams,
    readAssetReferenceSourceAssetId,
    readAssetVoiceAudio,
} from "@/lib/assetParams";

// 解析已保存的模型 ID，无效时回退到默认值
export function resolveSavedImageModelId(modelId: string | undefined) {
    const defaultModelId = IMAGE_GENERATION_MODELS[0]?.id ?? "seedream-5.0";
    const matchedModel = IMAGE_GENERATION_MODELS.find((option) => option.id === modelId);

    return matchedModel?.id ?? defaultModelId;
}

// 解析已保存的比例 ID
export function resolveSavedAspectRatio(aspectRatio: string | undefined): GenerationAspectRatioId {
    const allowedRatios: GenerationAspectRatioId[] = [
        "auto",
        "16:9",
        "21:9",
        "9:16",
        "4:3",
        "3:4",
        "1:1",
    ];

    if (aspectRatio && allowedRatios.includes(aspectRatio as GenerationAspectRatioId)) {
        return aspectRatio as GenerationAspectRatioId;
    }

    return "auto";
}

// 解析已保存的清晰度
export function resolveSavedResolution(resolution: string | undefined): GenerationResolution {
    if (
        resolution &&
        GENERATION_RESOLUTION_OPTIONS.includes(resolution as GenerationResolution)
    ) {
        return resolution as GenerationResolution;
    }

    return "3K";
}

// 解析已保存的图片风格 ID
export function resolveSavedImageStyle(styleId: string | undefined) {
    return resolveSavedImageStyleId(styleId);
}

// 从 params 读取生图设置并解析各字段默认值（供编辑器初始化）
export function resolveAssetGenerationDefaults(params: unknown) {
    const generation = readAssetGenerationSettings(params);

    return {
        prompt: generation?.prompt ?? "",
        modelId: resolveSavedImageModelId(generation?.modelId),
        aspectRatio: resolveSavedAspectRatio(generation?.aspectRatio),
        resolution: resolveSavedResolution(generation?.resolution),
        imageStyleId: resolveSavedImageStyle(generation?.imageStyleId),
        sourceUrl: generation?.sourceUrl,
    };
}

// 从 params 读取音频生成设置（供编辑器初始化）
export function resolveAssetAudioGenerationDefaults(params: unknown) {
    const audioGeneration = readAssetAudioGenerationSettings(params);

    return {
        prompt: audioGeneration?.prompt ?? "",
        referenceFiles: audioGeneration?.referenceFiles ?? [],
    };
}

// 从 params 读取文本节点内容
export function resolveAssetTextContent(params: unknown) {
    return readAssetCanvasParams(params)?.textContent ?? "";
}
