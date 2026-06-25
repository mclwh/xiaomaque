// 资产展示名称解析
import type { ProjectAsset } from "@/api/asset";
import { readAssetAppearanceName, readAssetEntityName } from "@/lib/assetParams";
import type { ProjectAssetDisplayGroup } from "@/lib/projectAssetGroups";

// DEFAULT_CHARACTER_APPEARANCE_LABEL 角色形象默认展示名
const DEFAULT_CHARACTER_APPEARANCE_LABEL = "基础形象";

// DEFAULT_CHARACTER_NAME_LABEL 角色默认展示名
const DEFAULT_CHARACTER_NAME_LABEL = "未命名角色";

// GENERIC_CHARACTER_ASSET_NAME 创建角色资产时的占位名称（不应作为形象名展示）
const GENERIC_CHARACTER_ASSET_NAME = "角色";

// 返回资产展示名称
export function resolveAssetLabel(
    asset: Pick<ProjectAsset, "id" | "name">,
    fallbackPrefix = "资产",
) {
    const trimmedName = asset.name?.trim();

    return trimmedName ? trimmedName : `${fallbackPrefix} #${asset.id}`;
}

// 返回音频资产展示名称
export function resolveAudioAssetLabel(asset: Pick<ProjectAsset, "id" | "name">) {
    return resolveAssetLabel(asset, "音频");
}

// 解析角色形象展示名称
export function resolveCharacterAppearanceLabel(
    asset: Pick<ProjectAsset, "name" | "type" | "params">,
    fallback = DEFAULT_CHARACTER_APPEARANCE_LABEL,
) {
    return readAssetAppearanceName(asset) ?? fallback;
}

// 解析角色/场景名称展示文案
export function resolveCharacterNameLabel(
    asset: Pick<ProjectAsset, "name" | "type" | "params">,
    fallback = DEFAULT_CHARACTER_NAME_LABEL,
) {
    return readAssetEntityName(asset) ?? fallback;
}

// 解析单个角色资产卡片上的角色名与形象名
export function resolveCharacterAssetCardLabels(
    asset: Pick<ProjectAsset, "name" | "type" | "params">,
    options?: {
        characterFallback?: string;
        appearanceFallback?: string;
    },
) {
    return {
        characterName: resolveCharacterNameLabel(
            asset,
            options?.characterFallback ?? DEFAULT_CHARACTER_NAME_LABEL,
        ),
        appearanceName: resolveCharacterAppearanceLabel(
            asset,
            options?.appearanceFallback ?? DEFAULT_CHARACTER_APPEARANCE_LABEL,
        ),
    };
}

// 解析角色分组卡片上的角色名与形象名
export function resolveCharacterGroupCardLabels(
    group: ProjectAssetDisplayGroup,
    options?: {
        characterFallback?: string;
        appearanceFallback?: string;
    },
) {
    const characterFallback = options?.characterFallback ?? DEFAULT_CHARACTER_NAME_LABEL;
    const appearanceFallback = options?.appearanceFallback ?? DEFAULT_CHARACTER_APPEARANCE_LABEL;
    const characterName =
        group.assets
            .map((asset) => readAssetEntityName(asset))
            .find((name): name is string => Boolean(name)) ?? characterFallback;
    const appearanceName = resolveCharacterAppearanceLabel(
        group.representativeAsset,
        appearanceFallback,
    );

    return {
        characterName,
        appearanceName,
    };
}

// 导出占位名常量供其他模块复用
export { GENERIC_CHARACTER_ASSET_NAME };
