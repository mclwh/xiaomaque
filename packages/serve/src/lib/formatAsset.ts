// 将数据库资产记录格式化为 API 响应结构
import { resolveAssetMediaUrl } from "./storageUrl.js";

// ApiAssetPayload 返回给前端的资产结构
export type ApiAssetPayload = {
    id: number;
    type: string;
    assetType: string;
    name: string | null;
    cover: string | null;
    url: string | null;
    params: unknown;
    projectId: number;
    deriveId: string | null;
    serieIds: number[];
    createdAt: Date;
    updatedAt: Date;
};

// 格式化返回给前端的资产信息
export function formatAssetForApi(asset: {
    id: number;
    type: string;
    asset_type: string;
    name: string | null;
    cover: string | null;
    url: string | null;
    params: unknown;
    project_id: number;
    derive_id: string | null;
    created_at: Date;
    updated_at: Date;
    asset_series?: Array<{ serie_id: number }>;
}): ApiAssetPayload {
    return {
        id: asset.id,
        type: asset.type,
        assetType: asset.asset_type,
        name: asset.name,
        cover: resolveAssetMediaUrl(asset.cover),
        url: resolveAssetMediaUrl(asset.url),
        params: asset.params,
        projectId: asset.project_id,
        deriveId: asset.derive_id,
        serieIds: asset.asset_series?.map((item) => item.serie_id) ?? [],
        createdAt: asset.created_at,
        updatedAt: asset.updated_at,
    };
}
