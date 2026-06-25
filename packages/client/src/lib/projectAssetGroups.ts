import type { ProjectAsset } from "@/api/asset";
import type { ProjectAssetTabKey } from "@/lib/projectAssetTabs";

// ProjectAssetDisplayGroup 资产页展示分组（同 derive_id 合并为一张卡片）
export type ProjectAssetDisplayGroup = {
    key: string;
    deriveId: string | null;
    assets: ProjectAsset[];
    representativeAsset: ProjectAsset;
    totalCount: number;
    pendingCount: number;
};

// PROJECT_ASSET_GROUP_UNIT 各 Tab 分组数量单位文案
export const PROJECT_ASSET_GROUP_UNIT: Record<ProjectAssetTabKey, string> = {
    character: "形象",
    scene: "场景",
    prop: "道具",
    material: "素材",
};

// 统计资产待补充项数量
export function countAssetPendingItems(asset: ProjectAsset) {
    if (asset.type === "material") {
        return asset.url || asset.cover ? 0 : 1;
    }

    return asset.cover ? 0 : 1;
}

// 构建单个展示分组
function buildProjectAssetDisplayGroup(
    deriveId: string | null,
    groupAssets: ProjectAsset[],
): ProjectAssetDisplayGroup {
    const representativeAsset =
        groupAssets.find((asset) => asset.cover || asset.url) ?? groupAssets[0];
    const pendingCount = groupAssets.reduce(
        (total, asset) => total + countAssetPendingItems(asset),
        0,
    );

    return {
        key: deriveId ?? `single-${groupAssets[0].id}`,
        deriveId,
        assets: groupAssets,
        representativeAsset,
        totalCount: groupAssets.length,
        pendingCount,
    };
}

// 将资产列表按 derive_id 合并为展示分组（无 derive_id 的单独成组）
export function groupProjectAssetsForDisplay(assets: ProjectAsset[]): ProjectAssetDisplayGroup[] {
    const assetsByDeriveId = new Map<string, ProjectAsset[]>();
    const seenDeriveIds = new Set<string>();
    const displayGroups: ProjectAssetDisplayGroup[] = [];

    for (const asset of assets) {
        if (!asset.deriveId) {
            continue;
        }

        const groupAssets = assetsByDeriveId.get(asset.deriveId) ?? [];
        groupAssets.push(asset);
        assetsByDeriveId.set(asset.deriveId, groupAssets);
    }

    for (const asset of assets) {
        if (asset.deriveId) {
            if (seenDeriveIds.has(asset.deriveId)) {
                continue;
            }

            seenDeriveIds.add(asset.deriveId);
            displayGroups.push(
                buildProjectAssetDisplayGroup(
                    asset.deriveId,
                    assetsByDeriveId.get(asset.deriveId) ?? [asset],
                ),
            );
            continue;
        }

        displayGroups.push(buildProjectAssetDisplayGroup(null, [asset]));
    }

    return displayGroups;
}

// 统计展示分组数量（Tab 计数用）
export function countProjectAssetDisplayGroups(assets: ProjectAsset[]) {
    return groupProjectAssetsForDisplay(assets).length;
}

// 生成分组卡片摘要文案
export function formatProjectAssetGroupSummary(tab: ProjectAssetTabKey, group: ProjectAssetDisplayGroup) {
    const unit = PROJECT_ASSET_GROUP_UNIT[tab];
    const countLabel = `${group.totalCount} 个${unit}`;

    if (group.pendingCount <= 0) {
        return countLabel;
    }

    return `${countLabel} · ${group.pendingCount} 待补充`;
}

// 解析分组展示名称
export function resolveProjectAssetGroupName(
    group: ProjectAssetDisplayGroup,
    unnamedLabel: string,
) {
    const namedAsset = group.assets.find((asset) => asset.name?.trim());

    return namedAsset?.name ?? group.representativeAsset.name ?? unnamedLabel;
}
