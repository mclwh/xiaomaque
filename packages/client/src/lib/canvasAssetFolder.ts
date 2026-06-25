import type { ProjectAsset } from "@/api/asset";
import {
    countProjectAssetDisplayGroups,
    groupProjectAssetsForDisplay,
} from "@/lib/projectAssetGroups";
import {
    PROJECT_ASSET_TAB_CATEGORY,
    PROJECT_ASSET_TAB_KEYS,
    type ProjectAssetTabCounts,
    type ProjectAssetTabKey,
} from "@/lib/projectAssetTabs";

// 按 Tab 筛选当前项目画布资产
export function filterCanvasAssetsByTab(assets: ProjectAsset[], tab: ProjectAssetTabKey) {
    return assets.filter((asset) => asset.type === PROJECT_ASSET_TAB_CATEGORY[tab]);
}

// 统计各 Tab 展示分组数量
export function buildCanvasAssetFolderTabCounts(assets: ProjectAsset[]): ProjectAssetTabCounts {
    return Object.fromEntries(
        PROJECT_ASSET_TAB_KEYS.map((tabKey) => [
            tabKey,
            countProjectAssetDisplayGroups(filterCanvasAssetsByTab(assets, tabKey)),
        ]),
    ) as ProjectAssetTabCounts;
}

// 获取指定 Tab 的展示分组
export function buildCanvasAssetFolderDisplayGroups(assets: ProjectAsset[], tab: ProjectAssetTabKey) {
    return groupProjectAssetsForDisplay(filterCanvasAssetsByTab(assets, tab));
}
