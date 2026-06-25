import type { ProjectAsset } from "@/api/asset";
import { resolveAssetLabel } from "@/lib/assetDisplay";
import {
    parseSerieFragmentReferenceList,
    type SerieFragmentReferenceItem,
} from "@/lib/serieFragmentReference";
import { resolveStoragePreviewUrl } from "@/lib/storageUrl";

// EpisodeFragmentReferenceStripItem 分镜引用资产条展示项
export type EpisodeFragmentReferenceStripItem = {
    assetId: number;
    previewUrl: string | null;
    label: string;
};

// 解析引用条展示标签
function resolveFragmentReferenceStripLabel(
    item: SerieFragmentReferenceItem,
    asset?: ProjectAsset,
) {
    if (item.characterName && item.appearanceName) {
        return `${item.characterName}·${item.appearanceName}`;
    }

    if (item.characterName) {
        return item.characterName;
    }

    if (asset) {
        return resolveAssetLabel(asset, "资产");
    }

    return `资产 ${item.assetId}`;
}

// 构建分镜引用资产条展示数据
export function buildEpisodeFragmentReferenceStripItems(
    reference: unknown[],
    assets: ProjectAsset[],
): EpisodeFragmentReferenceStripItem[] {
    const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

    return parseSerieFragmentReferenceList(reference).map((item) => {
        const asset = assetsById.get(item.assetId);
        const previewKey = item.url ?? asset?.cover ?? asset?.url ?? null;

        return {
            assetId: item.assetId,
            previewUrl: previewKey ? resolveStoragePreviewUrl(previewKey) : null,
            label: resolveFragmentReferenceStripLabel(item, asset),
        };
    });
}
