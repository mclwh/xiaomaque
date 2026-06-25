// 资产分类与画布节点类型映射
import type { ProjectAsset } from "@/api/asset";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";

/*
 * ASSET_CATEGORY_TYPES 资产 type 字段允许的取值
 * character 角色 | scene 场景 | prop 道具 | material 素材 | none 未归类（仅画布）
 */
export const ASSET_CATEGORY_TYPES = [
    "character",
    "scene",
    "prop",
    "material",
    "none",
] as const;

export type AssetCategoryType = (typeof ASSET_CATEGORY_TYPES)[number];

// ASSET_LIST_FILTER_TYPES 资产页 Tab 可筛选的分类（不含 none，none 仅出现在画布）
export const ASSET_LIST_FILTER_TYPES = [
    "character",
    "scene",
    "prop",
    "material",
] as const;

export type AssetListFilterType = (typeof ASSET_LIST_FILTER_TYPES)[number];

// 从资产记录解析画布节点类型（优先分类字段，未归类则读 asset_type）
export function resolveCanvasNodeKind(
    asset: Pick<ProjectAsset, "type" | "assetType">,
): CanvasNodeKind {
    if (asset.type === "character" || asset.type === "scene") {
        return asset.type;
    }

    if (
        asset.assetType === "video" ||
        asset.assetType === "image" ||
        asset.assetType === "text" ||
        asset.assetType === "audio"
    ) {
        return asset.assetType;
    }

    return "image";
}

// 判断资产是否属于素材 Tab（仅 material 分类，不含画布未归类 none）
export function isMaterialCategoryAsset(asset: Pick<ProjectAsset, "type">) {
    return asset.type === "material";
}
