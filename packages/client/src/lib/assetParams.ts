// 资产 params 读写与合并（统一入口，避免散落解析逻辑）
import type { ProjectAsset } from "@/api/asset";
import type {
    AssetParams,
    CanvasAssetParams,
    CanvasAudioCharacterBinding,
    CanvasAudioGenerationSettings,
    CanvasAudioReferenceFile,
    CanvasGenerationSettings,
    CanvasVoiceAudioBinding,
} from "@/types/assetParams";
import { ASSET_PARAMS_CANVAS_KEY } from "@/types/assetParams";

// 读取资产 params 顶层结构
export function readAssetParams(params: unknown): AssetParams | null {
    if (!params || typeof params !== "object") {
        return null;
    }

    return params as AssetParams;
}

// 读取 params.canvas 画布扩展数据
export function readAssetCanvasParams(params: unknown): CanvasAssetParams | null {
    const canvas = readAssetParams(params)?.[ASSET_PARAMS_CANVAS_KEY];

    if (!canvas || typeof canvas !== "object") {
        return null;
    }

    return canvas;
}

// 读取 params.canvas.generation 生图参数
export function readAssetGenerationSettings(params: unknown): CanvasGenerationSettings | null {
    const generation = readAssetCanvasParams(params)?.generation;

    if (!generation || typeof generation !== "object") {
        return null;
    }

    if (
        typeof generation.prompt !== "string" ||
        typeof generation.modelId !== "string" ||
        typeof generation.aspectRatio !== "string" ||
        typeof generation.resolution !== "string"
    ) {
        return null;
    }

    return generation;
}

// 读取 params.canvas.audioGeneration 音频生成参数
export function readAssetAudioGenerationSettings(
    params: unknown,
): CanvasAudioGenerationSettings | null {
    const audioGeneration = readAssetCanvasParams(params)?.audioGeneration;

    if (!audioGeneration || typeof audioGeneration !== "object") {
        return null;
    }

    if (typeof audioGeneration.prompt !== "string") {
        return null;
    }

    const referenceFiles = Array.isArray(audioGeneration.referenceFiles)
        ? audioGeneration.referenceFiles.filter(
              (file): file is CanvasAudioReferenceFile =>
                  !!file &&
                  typeof file === "object" &&
                  typeof file.key === "string" &&
                  typeof file.name === "string",
          )
        : undefined;

    return {
        prompt: audioGeneration.prompt,
        ...(referenceFiles && referenceFiles.length > 0 ? { referenceFiles } : {}),
    };
}

// 读取 params.canvas.voiceAudio 角色绑定的音频
export function readAssetVoiceAudio(params: unknown): CanvasVoiceAudioBinding | null {
    const voiceAudio = readAssetCanvasParams(params)?.voiceAudio;

    if (!voiceAudio || typeof voiceAudio !== "object") {
        return null;
    }

    if (typeof voiceAudio.sourceAssetId !== "number" || typeof voiceAudio.url !== "string") {
        return null;
    }

    return voiceAudio;
}

// GENERIC_CHARACTER_ENTITY_NAME 角色占位名称
const GENERIC_CHARACTER_ENTITY_NAME = "角色";

// GENERIC_SCENE_ENTITY_NAME 场景占位名称
const GENERIC_SCENE_ENTITY_NAME = "场景";

// 从 params 读取旧版角色名称（兼容迁移）
function readLegacyCharacterNameFromParams(params: unknown): string | null {
    const characterName = readAssetCanvasParams(params)?.characterName;

    if (typeof characterName !== "string") {
        return null;
    }

    const trimmed = characterName.trim();

    return trimmed.length > 0 ? trimmed : null;
}

// 读取角色/场景实体名称（存于 asset.name）
export function readAssetEntityName(
    asset: Pick<ProjectAsset, "name" | "type" | "params">,
): string | null {
    const legacyName = readLegacyCharacterNameFromParams(asset.params);

    if (legacyName) {
        return legacyName;
    }

    const trimmedName = asset.name?.trim();
    const genericName =
        asset.type === "scene" ? GENERIC_SCENE_ENTITY_NAME : GENERIC_CHARACTER_ENTITY_NAME;

    if (!trimmedName || trimmedName === genericName) {
        return null;
    }

    return trimmedName;
}

// 读取角色形象名称（存于 params.canvas.appearanceName）
export function readAssetAppearanceName(
    asset: Pick<ProjectAsset, "name" | "type" | "params">,
): string | null {
    const appearanceName = readAssetCanvasParams(asset.params)?.appearanceName;

    if (typeof appearanceName === "string") {
        const trimmed = appearanceName.trim();

        if (trimmed.length > 0) {
            return trimmed;
        }
    }

    // 兼容旧数据：形象名曾保存在 asset.name
    if (asset.type === "character" && readLegacyCharacterNameFromParams(asset.params)) {
        const legacyAppearance = asset.name?.trim();

        if (legacyAppearance && legacyAppearance !== GENERIC_CHARACTER_ENTITY_NAME) {
            return legacyAppearance;
        }
    }

    return null;
}

// 读取 params.canvas.characterName 角色名称（已废弃，请用 readAssetEntityName）
export function readAssetCharacterName(params: unknown): string | null {
    return readLegacyCharacterNameFromParams(params);
}

// 读取 params.canvas.audioCharacterBinding 音频绑定的角色记录
export function readAssetAudioCharacterBinding(params: unknown): CanvasAudioCharacterBinding | null {
    const binding = readAssetCanvasParams(params)?.audioCharacterBinding;

    if (!binding || typeof binding !== "object") {
        return null;
    }

    if (binding.mode !== "single" && binding.mode !== "derive_group") {
        return null;
    }

    if (!Array.isArray(binding.characterAssetIds)) {
        return null;
    }

    const characterAssetIds = binding.characterAssetIds.filter(
        (id): id is number => typeof id === "number",
    );

    if (characterAssetIds.length === 0) {
        return null;
    }

    return {
        mode: binding.mode,
        characterAssetIds,
        deriveId: typeof binding.deriveId === "string" ? binding.deriveId : null,
    };
}

// 读取 params.canvas.referenceSourceAssetId 引用来源资产 ID
export function readAssetReferenceSourceAssetId(params: unknown): number | null {
    const sourceAssetId = readAssetCanvasParams(params)?.referenceSourceAssetId;

    return typeof sourceAssetId === "number" ? sourceAssetId : null;
}

// 合并已有 params 与新的 canvas 字段，返回完整 AssetParams
export function mergeAssetParams(existingParams: unknown, canvas: CanvasAssetParams): AssetParams {
    const base = readAssetParams(existingParams) ?? {};

    return {
        ...base,
        [ASSET_PARAMS_CANVAS_KEY]: canvas,
    };
}

// 将 canvas 局部更新合并进已有 params
export function patchAssetCanvasParams(
    existingParams: unknown,
    patch: Partial<CanvasAssetParams>,
): AssetParams {
    const existingCanvas = readAssetCanvasParams(existingParams) ?? {};

    return mergeAssetParams(existingParams, {
        ...existingCanvas,
        ...patch,
    });
}

// 写入 params.canvas.generation
export function buildAssetParamsWithGeneration(
    existingParams: unknown,
    generation: CanvasGenerationSettings,
) {
    return patchAssetCanvasParams(existingParams, { generation });
}

// 写入 params.canvas.audioGeneration
export function buildAssetParamsWithAudioGeneration(
    existingParams: unknown,
    audioGeneration: CanvasAudioGenerationSettings,
) {
    return patchAssetCanvasParams(existingParams, { audioGeneration });
}

// 写入 params.canvas.voiceAudio
export function buildAssetParamsWithVoiceAudio(
    existingParams: unknown,
    voiceAudio: CanvasVoiceAudioBinding,
) {
    return patchAssetCanvasParams(existingParams, { voiceAudio });
}

// 写入 params.canvas.audioCharacterBinding
export function buildAssetParamsWithAudioCharacterBinding(
    existingParams: unknown,
    audioCharacterBinding: CanvasAudioCharacterBinding,
) {
    return patchAssetCanvasParams(existingParams, { audioCharacterBinding });
}

// 写入 params.canvas.referenceSourceAssetId
export function buildAssetParamsWithReferenceSource(
    existingParams: unknown,
    referenceSourceAssetId: number,
) {
    return patchAssetCanvasParams(existingParams, { referenceSourceAssetId });
}

// 清除 params.canvas.referenceSourceAssetId
export function buildAssetParamsWithoutReferenceSource(existingParams: unknown) {
    const existingCanvas = readAssetCanvasParams(existingParams) ?? {};
    const { referenceSourceAssetId: _removed, ...canvasWithoutReference } = existingCanvas;

    return mergeAssetParams(existingParams, canvasWithoutReference);
}

// 清除 params.canvas.voiceAudio
export function buildAssetParamsWithoutVoiceAudio(existingParams: unknown) {
    const existingCanvas = readAssetCanvasParams(existingParams) ?? {};
    const { voiceAudio: _removed, ...canvasWithoutVoiceAudio } = existingCanvas;

    return mergeAssetParams(existingParams, canvasWithoutVoiceAudio);
}

// 清除 params.canvas.audioCharacterBinding
export function buildAssetParamsWithoutAudioCharacterBinding(existingParams: unknown) {
    const existingCanvas = readAssetCanvasParams(existingParams) ?? {};
    const { audioCharacterBinding: _removed, ...canvasWithoutBinding } = existingCanvas;

    return mergeAssetParams(existingParams, canvasWithoutBinding);
}
