// 资产页 Tab 标识与 API 分类映射
import type { AssetListFilterType } from "@/lib/assetCategory";

// ProjectAssetTabKey 资产库 Tab 标识
export type ProjectAssetTabKey = "character" | "scene" | "prop" | "material";

// PROJECT_ASSET_TAB_KEYS 全部 Tab 键名（固定顺序）
export const PROJECT_ASSET_TAB_KEYS: ProjectAssetTabKey[] = [
    "character",
    "scene",
    "prop",
    "material",
];

// 资产页各 Tab 资产数量
export type ProjectAssetTabCounts = Record<ProjectAssetTabKey, number>;

// PROJECT_ASSET_TAB_CATEGORY 各 Tab 对应的资产 type 筛选值
export const PROJECT_ASSET_TAB_CATEGORY: Record<ProjectAssetTabKey, AssetListFilterType> = {
    character: "character",
    scene: "scene",
    prop: "prop",
    material: "material",
};
