import type { ProjectAsset } from "@/api/asset";
import {
    groupProjectAssetsForDisplay,
    type ProjectAssetDisplayGroup,
} from "@/lib/projectAssetGroups";
import {
    PROJECT_ASSET_TAB_KEYS,
    type ProjectAssetTabKey,
} from "@/lib/projectAssetTabs";

// EpisodeAssetScope 素材栏范围：本集 / 全集
export type EpisodeAssetScope = "episode" | "series";

// EpisodeAssetSidebarSection 素材栏分组区块
export type EpisodeAssetSidebarSection = {
    tabKey: ProjectAssetTabKey;
    label: string;
    groups: ProjectAssetDisplayGroup[];
};

// EPISODE_ASSET_TAB_LABEL 素材分类标签
export const EPISODE_ASSET_TAB_LABEL: Record<ProjectAssetTabKey, string> = {
    character: "角色",
    scene: "场景",
    prop: "道具",
    material: "素材",
};

// 判断资产是否通过 asset_serie 绑定到当前分集
export function isAssetInEpisodeScope(
    asset: Pick<ProjectAsset, "serieIds">,
    serieId: number,
): boolean {
    const serieIds = asset.serieIds ?? [];

    return serieIds.includes(serieId);
}

// 按本集 / 全集范围筛选资产
export function filterAssetsByEpisodeScope(
    assets: ProjectAsset[],
    serieId: number,
    scope: EpisodeAssetScope,
): ProjectAsset[] {
    if (scope === "series") {
        return assets;
    }

    return assets.filter((asset) => isAssetInEpisodeScope(asset, serieId));
}

// 构建素材栏展示分组（可按分类筛选单个区块）
export function buildEpisodeAssetSidebarSections(
    assets: ProjectAsset[],
    serieId: number,
    scope: EpisodeAssetScope,
    filter: ProjectAssetTabKey | null,
): EpisodeAssetSidebarSection[] {
    const scopedAssets = filterAssetsByEpisodeScope(assets, serieId, scope);
    const tabKeys = filter ? [filter] : PROJECT_ASSET_TAB_KEYS;

    return tabKeys
        .map((tabKey) => {
            const tabAssets = scopedAssets.filter((asset) => asset.type === tabKey);
            const groups = groupProjectAssetsForDisplay(tabAssets);

            return {
                tabKey,
                label: EPISODE_ASSET_TAB_LABEL[tabKey],
                groups,
            };
        })
        .filter((section) => section.groups.length > 0);
}
