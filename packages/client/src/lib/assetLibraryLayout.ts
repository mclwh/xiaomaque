import type { AssetLibraryTab, AssetLibraryViewMode } from "@/lib/assetLibraryUi";
import {
    ASSET_LIBRARY_GRID_GAP,
    ASSET_LIBRARY_MAX_COLUMNS,
    getAssetLibraryCardHeight,
    getAssetLibraryCardWidth,
    isCompactAssetLibraryTab,
} from "@/lib/assetLibraryUi";
import type { ProjectAssetDisplayGroup } from "@/lib/projectAssetGroups";

// ASSET_LIBRARY_LIST_CARD_HEIGHT 列表视图单卡高度
export const ASSET_LIBRARY_LIST_CARD_HEIGHT = 76;

// ASSET_LIBRARY_LIST_ROW_HEIGHT 列表视图虚拟行高（含行间距）
export const ASSET_LIBRARY_LIST_ROW_HEIGHT =
    ASSET_LIBRARY_LIST_CARD_HEIGHT + ASSET_LIBRARY_GRID_GAP;

// 根据容器宽度计算网格列数（最多 6 列）
export function getAssetLibraryColumnCount(containerWidth: number, tab: AssetLibraryTab) {
    const minCardWidth = getAssetLibraryCardWidth(tab);
    const naturalCount = Math.floor(
        (containerWidth + ASSET_LIBRARY_GRID_GAP) / (minCardWidth + ASSET_LIBRARY_GRID_GAP),
    );

    return Math.min(ASSET_LIBRARY_MAX_COLUMNS, Math.max(1, naturalCount));
}

// 根据列数计算自适应卡片宽度
export function getAssetLibraryAdaptiveCardWidth(
    containerWidth: number,
    columnCount: number,
    tab: AssetLibraryTab,
) {
    if (columnCount <= 0 || containerWidth <= 0) {
        return getAssetLibraryCardWidth(tab);
    }

    return (containerWidth - (columnCount - 1) * ASSET_LIBRARY_GRID_GAP) / columnCount;
}

// 根据自适应宽度估算卡片高度
export function getAssetLibraryAdaptiveCardHeight(tab: AssetLibraryTab, cardWidth: number) {
    const designWidth = getAssetLibraryCardWidth(tab);
    const designHeight = getAssetLibraryCardHeight(tab);

    return cardWidth * (designHeight / designWidth);
}

// 估算网格视图下单行高度（固定设计宽度，兼容旧逻辑）
export function getAssetLibraryGridRowHeight(tab: AssetLibraryTab) {
    const cardHeight = getAssetLibraryCardHeight(tab);
    const isCompactCard = isCompactAssetLibraryTab(tab);

    if (isCompactCard) {
        return cardHeight;
    }

    return cardHeight + 56;
}

// 获取虚拟列表行高
export function getAssetLibraryVirtualRowHeight(
    tab: AssetLibraryTab,
    viewMode: AssetLibraryViewMode,
    adaptiveCardWidth?: number,
) {
    if (viewMode === "list") {
        return ASSET_LIBRARY_LIST_ROW_HEIGHT;
    }

    const cardHeight =
        adaptiveCardWidth && adaptiveCardWidth > 0
            ? getAssetLibraryAdaptiveCardHeight(tab, adaptiveCardWidth)
            : getAssetLibraryGridRowHeight(tab);

    return cardHeight + ASSET_LIBRARY_GRID_GAP;
}

// 将展示分组按列数切分为虚拟行
export function chunkAssetLibraryDisplayGroups(
    groups: ProjectAssetDisplayGroup[],
    columnCount: number,
) {
    const rows: ProjectAssetDisplayGroup[][] = [];

    for (let index = 0; index < groups.length; index += columnCount) {
        rows.push(groups.slice(index, index + columnCount));
    }

    return rows;
}
