// 资产库 Tab 与展示配置
import {
    Building2,
    Shapes,
    Star,
    User,
    type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { ProjectAssetTabKey } from "@/lib/projectAssetTabs";

// AssetLibraryTab 资产库 Tab 标识
export type AssetLibraryTab = ProjectAssetTabKey;

// AssetLibraryTabConfig 资产库 Tab 配置
export type AssetLibraryTabConfig = {
    id: AssetLibraryTab;
    label: string;
    icon: LucideIcon;
    unnamedLabel: string;
};

// ASSET_LIBRARY_TABS 资产库顶部 Tab 配置
export const ASSET_LIBRARY_TABS: AssetLibraryTabConfig[] = [
    { id: "character", label: "角色", icon: User, unnamedLabel: "未命名角色" },
    { id: "scene", label: "场景", icon: Building2, unnamedLabel: "未命名场景" },
    { id: "prop", label: "道具", icon: Star, unnamedLabel: "未命名道具" },
    { id: "material", label: "素材", icon: Shapes, unnamedLabel: "未命名素材" },
];

// AssetLibraryCardSize 资产卡片默认尺寸
type AssetLibraryCardSize = {
    width: number;
    height: number;
};

// ASSET_LIBRARY_CARD_SIZES 各 Tab 资产卡片默认尺寸
const ASSET_LIBRARY_CARD_SIZES: Record<AssetLibraryTab, AssetLibraryCardSize> = {
    character: { width: 195, height: 292 },
    scene: { width: 333, height: 248 },
    prop: { width: 142, height: 142 },
    material: { width: 142, height: 142 },
};

// 获取资产库卡片宽度（像素）
export function getAssetLibraryCardWidth(tab: AssetLibraryTab) {
    return ASSET_LIBRARY_CARD_SIZES[tab].width;
}

// 获取资产库卡片高度（像素）
export function getAssetLibraryCardHeight(tab: AssetLibraryTab) {
    return ASSET_LIBRARY_CARD_SIZES[tab].height;
}

// AssetLibraryViewMode 资产库视图模式
export type AssetLibraryViewMode = "grid" | "list";

// AssetLibraryFilter 资产库筛选条件
export type AssetLibraryFilter = "all" | "pending";

// AssetLibrarySortOrder 资产库排序方向
export type AssetLibrarySortOrder = "asc" | "desc";

// ASSET_LIBRARY_GRID_GAP 资产库网格间距
export const ASSET_LIBRARY_GRID_GAP = 16;

// ASSET_LIBRARY_MAX_COLUMNS 资产库网格每行最多列数
export const ASSET_LIBRARY_MAX_COLUMNS = 6;

// 获取资产库列表网格布局样式
export function getAssetLibraryGridStyle(tab: AssetLibraryTab): CSSProperties {
    const { width } = ASSET_LIBRARY_CARD_SIZES[tab];

    return {
        gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${width}px), ${width}px))`,
    };
}

// 获取资产库卡片尺寸样式
export function getAssetLibraryCardStyle(tab: AssetLibraryTab, fluid = false): CSSProperties {
    const size = ASSET_LIBRARY_CARD_SIZES[tab];

    return {
        width: "100%",
        ...(fluid ? {} : { maxWidth: size.width }),
        aspectRatio: `${size.width} / ${size.height}`,
    };
}

// 获取资产库卡片预览区尺寸样式
export function getAssetLibraryPreviewStyle(tab: AssetLibraryTab): CSSProperties {
    const isCompactCard = tab === "prop" || tab === "material";

    if (isCompactCard) {
        return {
            width: "100%",
            height: "100%",
        };
    }

    return {
        width: "100%",
        flex: 1,
        minHeight: 0,
    };
}

// 判断是否为紧凑型资产卡片
export function isCompactAssetLibraryTab(tab: AssetLibraryTab) {
    return tab === "prop" || tab === "material";
}
