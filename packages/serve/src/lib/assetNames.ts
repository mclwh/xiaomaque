// 从资产记录解析角色/场景名与形象名（与前端 assetParams 逻辑一致）

// GENERIC_CHARACTER_ENTITY_NAME 角色占位名称
const GENERIC_CHARACTER_ENTITY_NAME = "角色";

// GENERIC_SCENE_ENTITY_NAME 场景占位名称
const GENERIC_SCENE_ENTITY_NAME = "场景";

// 读取 params.canvas 命名空间
function readAssetCanvasParams(params: unknown) {
    if (!params || typeof params !== "object") {
        return null;
    }

    const canvas = (params as Record<string, unknown>).canvas;

    if (!canvas || typeof canvas !== "object") {
        return null;
    }

    return canvas as Record<string, unknown>;
}

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
export function readAssetEntityName(asset: {
    name: string | null;
    type: string;
    params: unknown;
}): string | null {
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
export function readAssetAppearanceName(asset: {
    name: string | null;
    type: string;
    params: unknown;
}): string | null {
    const appearanceName = readAssetCanvasParams(asset.params)?.appearanceName;

    if (typeof appearanceName === "string") {
        const trimmed = appearanceName.trim();

        if (trimmed.length > 0) {
            return trimmed;
        }
    }

    if (asset.type === "character" && readLegacyCharacterNameFromParams(asset.params)) {
        const legacyAppearance = asset.name?.trim();

        if (legacyAppearance && legacyAppearance !== GENERIC_CHARACTER_ENTITY_NAME) {
            return legacyAppearance;
        }
    }

    return null;
}
