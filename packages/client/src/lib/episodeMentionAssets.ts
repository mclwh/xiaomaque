import type { ProjectAsset } from "@/api/asset";
import {
    resolveCharacterAssetCardLabels,
    resolveAssetLabel,
} from "@/lib/assetDisplay";
import {
    buildEpisodeAssetSidebarSections,
    type EpisodeAssetScope,
} from "@/lib/episodeAssetSidebar";
import { readAssetVoiceAudio } from "@/lib/assetParams";
import type { ProjectAssetTabKey } from "@/lib/projectAssetTabs";
import { resolveStoragePreviewUrl } from "@/lib/storageUrl";

// EpisodeMentionAssetItem @ 引用列表项
export type EpisodeMentionAssetItem = {
    asset: ProjectAsset;
    tabKey: ProjectAssetTabKey;
    sectionLabel: string;
    primaryLabel: string;
    secondaryLabel: string | null;
    previewUrl: string | null;
    searchText: string;
};

// 构建 @ 引用资产扁平列表（按分类分组顺序）
export function buildEpisodeMentionAssetItems(
    assets: ProjectAsset[],
    serieId: number,
    scope: EpisodeAssetScope,
    query: string,
): EpisodeMentionAssetItem[] {
    const sections = buildEpisodeAssetSidebarSections(assets, serieId, scope, null);
    const normalizedQuery = query.trim().toLowerCase();
    const items: EpisodeMentionAssetItem[] = [];

    for (const section of sections) {
        for (const group of section.groups) {
            for (const asset of group.assets) {
                const isCharacter = section.tabKey === "character";
                const characterLabels = isCharacter
                    ? resolveCharacterAssetCardLabels(asset)
                    : null;
                const primaryLabel = isCharacter
                    ? characterLabels!.characterName
                    : resolveAssetLabel(asset, section.label);
                const secondaryLabel = isCharacter ? characterLabels!.appearanceName : null;
                const previewUrl =
                    section.tabKey === "material"
                        ? null
                        : resolveStoragePreviewUrl(asset.cover ?? asset.url);
                const searchText = [primaryLabel, secondaryLabel ?? "", asset.name ?? ""]
                    .join(" ")
                    .toLowerCase();

                if (normalizedQuery && !searchText.includes(normalizedQuery)) {
                    continue;
                }

                items.push({
                    asset,
                    tabKey: section.tabKey,
                    sectionLabel: section.label,
                    primaryLabel,
                    secondaryLabel,
                    previewUrl,
                    searchText,
                });
            }
        }
    }

    return items;
}

// MentionChipData 编辑器内联引用标签数据
export type MentionChipData = {
    assetId: number;
    label: string;
    previewUrl: string | null;
    // characterName 角色名称（仅角色资产）
    characterName?: string;
    // appearanceName 形象名称（仅角色资产）
    appearanceName?: string;
    // hasVoiceAudio 是否已绑定音频（仅角色资产）
    hasVoiceAudio?: boolean;
};

// 返回 @ 引用标签展示文案（优先形象名）
export function resolveEpisodeMentionChipLabel(item: EpisodeMentionAssetItem) {
    return item.secondaryLabel ?? item.primaryLabel;
}

// 从资产构建 @ 引用标签数据
export function resolveMentionChipFromAsset(asset: ProjectAsset): MentionChipData {
    const previewUrl =
        asset.type === "material" ? null : resolveStoragePreviewUrl(asset.cover ?? asset.url);

    if (asset.type === "character") {
        const { characterName, appearanceName } = resolveCharacterAssetCardLabels(asset);

        return {
            assetId: asset.id,
            label: appearanceName,
            previewUrl,
            characterName,
            appearanceName,
            hasVoiceAudio: Boolean(readAssetVoiceAudio(asset.params)),
        };
    }

    return {
        assetId: asset.id,
        label: resolveAssetLabel(asset, "资产"),
        previewUrl,
    };
}

// 从 @ 引用列表项构建标签数据
export function resolveMentionChipFromItem(item: EpisodeMentionAssetItem): MentionChipData {
    if (item.tabKey === "character") {
        return {
            assetId: item.asset.id,
            label: item.secondaryLabel ?? item.primaryLabel,
            previewUrl: item.previewUrl,
            characterName: item.primaryLabel,
            appearanceName: item.secondaryLabel ?? item.primaryLabel,
            hasVoiceAudio: Boolean(readAssetVoiceAudio(item.asset.params)),
        };
    }

    return {
        assetId: item.asset.id,
        label: item.primaryLabel,
        previewUrl: item.previewUrl,
    };
}
