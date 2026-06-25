import type { ProjectAsset } from "@/api/asset";
import { readAssetReferenceSourceAssetId } from "@/lib/assetParams";

// 解析资产的 derive_id
export function resolveAssetDeriveId(
    asset: Pick<ProjectAsset, "deriveId"> | null | undefined,
): string | null {
    return asset?.deriveId ?? null;
}

// 查找同衍生组内的其他资产（不含自身）
export function resolveDerivePeerAssets(
    assets: ProjectAsset[],
    asset: Pick<ProjectAsset, "id" | "deriveId"> | null | undefined,
): ProjectAsset[] {
    const deriveId = resolveAssetDeriveId(asset);

    if (!deriveId || !asset) {
        return [];
    }

    return assets.filter((item) => item.deriveId === deriveId && item.id !== asset.id);
}

// 解析引用创建时的直接来源资产 ID
export function resolveReferenceSourceAssetId(
    asset: Pick<ProjectAsset, "params"> | null | undefined,
): number | null {
    return readAssetReferenceSourceAssetId(asset?.params ?? null);
}

// 查找引用创建时的直接来源资产
export function resolveReferenceSourceAsset(
    assets: ProjectAsset[],
    asset: Pick<ProjectAsset, "params"> | null | undefined,
): ProjectAsset | null {
    const sourceAssetId = resolveReferenceSourceAssetId(asset);

    if (!sourceAssetId) {
        return null;
    }

    return assets.find((item) => item.id === sourceAssetId) ?? null;
}

// 提取资产可用作参考图的 URL（优先 url，其次 cover）
export function resolveAssetReferenceImageUrl(asset: Pick<ProjectAsset, "url" | "cover"> | null) {
    if (!asset) {
        return null;
    }

    return asset.url ?? asset.cover ?? null;
}

// 收集直接来源节点的参考图 URL（仅一张）
export function collectReferenceSourceImageUrls(
    assets: ProjectAsset[],
    asset: Pick<ProjectAsset, "params" | "url" | "cover"> | null | undefined,
): string[] {
    const referenceUrl = resolveAssetReferenceImageUrl(resolveReferenceSourceAsset(assets, asset));

    return referenceUrl ? [referenceUrl] : [];
}

// 解析直接来源节点的参考图展示信息
export function resolveReferenceSourceDisplay(
    assets: ProjectAsset[],
    asset: Pick<ProjectAsset, "params" | "url" | "cover" | "name"> | null | undefined,
) {
    const sourceAsset = resolveReferenceSourceAsset(assets, asset);
    const imageUrl = resolveAssetReferenceImageUrl(sourceAsset);

    if (!sourceAsset || !imageUrl) {
        return null;
    }

    return {
        asset: sourceAsset,
        imageUrl,
    };
}