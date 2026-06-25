import { z } from "zod";
import { ASSET_LIST_FILTER_TYPES, ASSET_CATEGORY_TYPES, CANVAS_NODE_KINDS } from "../lib/assetCategory.js";
import { DERIVE_ID_PATTERN } from "../lib/deriveId.js";

export const listAssetsSchema = z.object({
    project_id: z.coerce.number().int().positive("项目 ID 无效"),
    type: z.enum(ASSET_LIST_FILTER_TYPES).optional(),
});

// listLibraryAssetsSchema 资产库跨项目列表 query 校验
export const listLibraryAssetsSchema = z.object({
    type: z.enum(ASSET_LIST_FILTER_TYPES, { message: "资产分类无效" }),
    page: z.coerce.number().int().min(1).optional().default(1),
    page_size: z.coerce.number().int().min(1).max(100).optional().default(48),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    keyword: z.string().trim().max(100).optional(),
    filter: z.enum(["all", "pending"]).optional().default("all"),
});

// 创建资产时 type 为画布节点类型，入库时会映射为 type + asset_type
export const createAssetSchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
    type: z.enum(CANVAS_NODE_KINDS, { message: "资产类型无效" }),
});

// createReferencedAssetSchema 引用源节点创建资产
export const createReferencedAssetSchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
    type: z.enum(CANVAS_NODE_KINDS, { message: "资产类型无效" }),
    source_asset_id: z.number().int().positive("引用源资产 ID 无效"),
});

// updateAssetDeriveSchema 更新资产 derive_id（设为 null 表示退出衍生组）
export const updateAssetDeriveSchema = z.object({
    asset_id: z.number().int().positive("资产 ID 无效"),
    derive_id: z
        .string()
        .regex(DERIVE_ID_PATTERN, "衍生 ID 格式无效")
        .nullable(),
});

export const batchDeleteAssetsSchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
    asset_ids: z
        .array(z.number().int().positive("资产 ID 无效"))
        .min(1, "至少选择一个资产"),
});

export const saveAssetsSchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
    assets: z.array(
        z.object({
            asset_id: z.number().int().positive("资产 ID 无效"),
            params: z.record(z.string(), z.unknown()),
        }),
    ),
});

// updateAssetMediaSchema 更新资产媒体地址
export const updateAssetMediaSchema = z.object({
    asset_id: z.number().int().positive("资产 ID 无效"),
    url: z.string().trim().min(1, "资源 key 不能为空"),
    cover: z.string().trim().min(1, "封面 key 无效").optional(),
});

// updateAssetTypeSchema 更新资产分类 type
export const updateAssetTypeSchema = z.object({
    asset_id: z.number().int().positive("资产 ID 无效"),
    type: z.enum(ASSET_CATEGORY_TYPES, { message: "资产分类无效" }),
});

// updateAssetProfileSchema 更新角色/场景资料（名称与出现集数）
export const updateAssetProfileSchema = z.object({
    asset_id: z.number().int().positive("资产 ID 无效"),
    character_name: z.string().trim().max(100, "角色名称过长").optional(),
    appearance_name: z.string().trim().max(100, "形象名称过长").optional(),
    serie_ids: z.array(z.number().int().positive("集数 ID 无效")).optional(),
});

/*
 * 各 schema 推导出的请求参数类型，供控制器复用
 */
export type ListAssetsInput = z.infer<typeof listAssetsSchema>;
export type ListLibraryAssetsInput = z.infer<typeof listLibraryAssetsSchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type CreateReferencedAssetInput = z.infer<typeof createReferencedAssetSchema>;
export type UpdateAssetDeriveInput = z.infer<typeof updateAssetDeriveSchema>;
export type BatchDeleteAssetsInput = z.infer<typeof batchDeleteAssetsSchema>;
export type SaveAssetsInput = z.infer<typeof saveAssetsSchema>;
export type UpdateAssetMediaInput = z.infer<typeof updateAssetMediaSchema>;
export type UpdateAssetTypeInput = z.infer<typeof updateAssetTypeSchema>;
export type UpdateAssetProfileInput = z.infer<typeof updateAssetProfileSchema>;
