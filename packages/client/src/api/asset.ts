import { request } from "@/api/http";
import type { RequestOptions } from "@/api/types";
import type { AssetListFilterType, AssetCategoryType } from "@/lib/assetCategory";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import type { AssetParams } from "@/types/assetParams";

// ProjectAsset 项目资产
export type ProjectAsset = {
    id: number;
    type: string;
    assetType: string;
    name: string | null;
    cover: string | null;
    url: string | null;
    params: AssetParams | null;
    projectId: number;
    deriveId: string | null;
    serieIds: number[];
    createdAt: string;
    updatedAt: string;
};

// CreateAssetPayload 新建资产请求体（type 为画布节点类型，非数据库 type 分类字段）
export type CreateAssetPayload = {
    project_id: number;
    type: CanvasNodeKind;
};

// CreateReferencedAssetPayload 引用源节点创建资产请求体
export type CreateReferencedAssetPayload = {
    project_id: number;
    type: CanvasNodeKind;
    source_asset_id: number;
};

// CreateReferencedAssetResult 引用创建返回（含可能更新的源资产）
export type CreateReferencedAssetResult = {
    asset: ProjectAsset;
    sourceAsset: ProjectAsset;
};

// UpdateAssetDerivePayload 更新资产衍生组请求体
export type UpdateAssetDerivePayload = {
    asset_id: number;
    derive_id: string | null;
};

// BatchDeleteAssetsPayload 批量删除资产请求体
export type BatchDeleteAssetsPayload = {
    project_id: number;
    asset_ids: number[];
};

import type { SaveAssetParamsItem } from "@/types/assetParams";

// SaveCanvasAssetsPayload 批量保存资产 params
export type SaveCanvasAssetsPayload = {
    project_id: number;
    assets: SaveAssetParamsItem[];
};

// FetchProjectAssetsOptions 查询项目资产列表的可选参数
export type FetchProjectAssetsOptions = RequestOptions & {
    categoryType?: AssetListFilterType;
};

// 查询项目下的资产列表（画布不传 categoryType 以包含 type=none；资产页按 Tab 传 categoryType）
export function fetchProjectAssets(
    projectId: number,
    options?: FetchProjectAssetsOptions,
) {
    return request<ProjectAsset[]>("/asset/list", {
        method: "GET",
        params: {
            project_id: projectId,
            ...(options?.categoryType ? { type: options.categoryType } : {}),
        },
        signal: options?.signal,
    });
}

// LibraryAssetsPage 资产库分页响应
export type LibraryAssetsPage = {
    items: ProjectAsset[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
};

// FetchLibraryAssetsParams 资产库列表查询参数
export type FetchLibraryAssetsParams = {
    type: AssetListFilterType;
    page?: number;
    page_size?: number;
    sort?: "asc" | "desc";
    keyword?: string;
    filter?: "all" | "pending";
};

// FetchLibraryAssetsOptions 资产库列表请求选项
export type FetchLibraryAssetsOptions = RequestOptions & FetchLibraryAssetsParams;

// 查询当前用户资产库列表（跨项目，按分类筛选并分页）
export function fetchLibraryAssets({
    type,
    page,
    page_size,
    sort,
    keyword,
    filter,
    signal,
}: FetchLibraryAssetsOptions) {
    return request<LibraryAssetsPage>("/asset/library", {
        method: "GET",
        params: {
            type,
            page,
            page_size,
            sort,
            keyword: keyword?.trim() || undefined,
            filter,
        },
        signal,
    });
}

// 新建项目资产
export function createAsset(payload: CreateAssetPayload) {
    return request<ProjectAsset>("/asset/create", {
        method: "POST",
        data: payload,
    });
}

// 引用源节点创建项目资产并绑定 derive_id
export function createReferencedAsset(payload: CreateReferencedAssetPayload) {
    return request<CreateReferencedAssetResult>("/asset/create_referenced", {
        method: "POST",
        data: payload,
    });
}

// 批量删除项目资产
export function batchDeleteAssets(payload: BatchDeleteAssetsPayload) {
    return request<Array<{ id: number }>>("/asset/batch_delete", {
        method: "POST",
        data: payload,
    });
}

// UpdateAssetMediaPayload 更新资产 media key 请求体
export type UpdateAssetMediaPayload = {
    asset_id: number;
    url: string;
    cover?: string;
};

// 更新资产 url / cover（仅存存储 key）
export function updateAssetMedia(payload: UpdateAssetMediaPayload) {
    return request<ProjectAsset>("/asset/update_media", {
        method: "POST",
        data: payload,
    });
}

// UpdateAssetTypePayload 更新资产分类 type 请求体
export type UpdateAssetTypePayload = {
    asset_id: number;
    type: AssetCategoryType;
};

// 更新资产 type 分类
export function updateAssetType(payload: UpdateAssetTypePayload) {
    return request<ProjectAsset>("/asset/update_type", {
        method: "POST",
        data: payload,
    });
}

// 更新资产 derive_id
export function updateAssetDerive(payload: UpdateAssetDerivePayload) {
    return request<ProjectAsset>("/asset/update_derive", {
        method: "POST",
        data: payload,
    });
}

// 批量保存画布资产 params
export function saveCanvasAssets(payload: SaveCanvasAssetsPayload) {
    return request<ProjectAsset[]>("/asset/save", {
        method: "POST",
        data: payload,
    });
}

// UpdateAssetProfilePayload 更新角色/场景资料请求体
export type UpdateAssetProfilePayload = {
    asset_id: number;
    character_name?: string;
    appearance_name?: string;
    serie_ids?: number[];
};

// 更新角色/场景资料（名称与出现集数）
export function updateAssetProfile(payload: UpdateAssetProfilePayload) {
    return request<ProjectAsset[]>("/asset/update_profile", {
        method: "POST",
        data: payload,
    });
}
