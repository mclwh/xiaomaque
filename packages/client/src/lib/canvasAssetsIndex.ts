// 画布资产归一化索引：assetsById + assetIds
import type { ProjectAsset } from "@/api/asset";

// CanvasAssetsIndex 归一化资产结构
export type CanvasAssetsIndex = {
    assetsById: Record<number, ProjectAsset>;
    assetIds: number[];
};

// 由资产列表构建归一化索引
export function buildAssetsIndex(assets: ProjectAsset[]): CanvasAssetsIndex {
    /*
     * assetsById id → 资产映射
     * assetIds 有序 id 列表
     */
    const assetsById: Record<number, ProjectAsset> = {};
    const assetIds: number[] = [];

    for (const asset of assets) {
        assetsById[asset.id] = asset;
        assetIds.push(asset.id);
    }

    return { assetsById, assetIds };
}

// 将归一化索引还原为资产数组
export function assetsIndexToList(index: CanvasAssetsIndex): ProjectAsset[] {
    return index.assetIds.map((id) => index.assetsById[id]).filter(Boolean);
}

// 写入或更新单个资产
export function upsertAssetInIndex(
    index: CanvasAssetsIndex,
    asset: ProjectAsset,
): CanvasAssetsIndex {
    const assetsById = { ...index.assetsById, [asset.id]: asset };
    const assetIds = index.assetIds.includes(asset.id)
        ? index.assetIds
        : [...index.assetIds, asset.id];

    return { assetsById, assetIds };
}

// 批量合并资产更新（仅替换变更 id 的引用）
export function mergeAssetsInIndex(
    index: CanvasAssetsIndex,
    updates: Map<number, ProjectAsset>,
): CanvasAssetsIndex {
    if (updates.size === 0) {
        return index;
    }

    const assetsById = { ...index.assetsById };

    for (const [id, asset] of updates) {
        assetsById[id] = asset;
    }

    return { assetsById, assetIds: index.assetIds };
}

// 从索引中移除资产
export function removeAssetsFromIndex(
    index: CanvasAssetsIndex,
    assetIdsToRemove: number[],
): CanvasAssetsIndex {
    if (assetIdsToRemove.length === 0) {
        return index;
    }

    const removeSet = new Set(assetIdsToRemove);
    const assetsById = { ...index.assetsById };

    for (const id of assetIdsToRemove) {
        delete assetsById[id];
    }

    return {
        assetsById,
        assetIds: index.assetIds.filter((id) => !removeSet.has(id)),
    };
}

// 追加新资产到索引末尾
export function appendAssetToIndex(
    index: CanvasAssetsIndex,
    asset: ProjectAsset,
): CanvasAssetsIndex {
    return upsertAssetInIndex(index, asset);
}
