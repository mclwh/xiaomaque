// 资产分类与画布节点类型映射

// ASSET_LIST_FILTER_TYPES 资产页列表可筛选的分类（不含 none）
export const ASSET_LIST_FILTER_TYPES = [
    "character",
    "scene",
    "prop",
    "material",
] as const;

export type AssetListFilterType = (typeof ASSET_LIST_FILTER_TYPES)[number];

/*
 * ASSET_CATEGORY_TYPES 资产 type 字段：角色、场景、道具、素材、未归类
 */
export const ASSET_CATEGORY_TYPES = [
    "character",
    "scene",
    "prop",
    "material",
    "none",
] as const;

// CANVAS_NODE_KINDS 创建画布节点时 API 传入的节点类型
export const CANVAS_NODE_KINDS = [
    "character",
    "scene",
    "video",
    "image",
    "text",
    "audio",
] as const;

// CANVAS_KIND_LABELS 画布节点默认名称
const CANVAS_KIND_LABELS: Record<string, string> = {
    character: "角色",
    scene: "场景",
    video: "视频",
    image: "图片",
    text: "文本",
    audio: "音频",
};

// 将画布节点类型映射为数据库 type + asset_type
export function resolveAssetCategoryFields(canvasKind: string) {
    if (canvasKind === "character") {
        return { type: "character", asset_type: "image" };
    }

    if (canvasKind === "scene") {
        return { type: "scene", asset_type: "image" };
    }

    if (canvasKind === "video") {
        return { type: "none", asset_type: "video" };
    }

    if (canvasKind === "image") {
        return { type: "none", asset_type: "image" };
    }

    if (canvasKind === "text") {
        return { type: "none", asset_type: "text" };
    }

    if (canvasKind === "audio") {
        return { type: "none", asset_type: "audio" };
    }

    if (canvasKind === "prop") {
        return { type: "prop", asset_type: "image" };
    }

    if (canvasKind === "material") {
        return { type: "material", asset_type: "image" };
    }

    return null;
}

// 获取画布节点创建时的默认名称
export function getCanvasKindDefaultName(canvasKind: string) {
    return CANVAS_KIND_LABELS[canvasKind] ?? "未命名";
}
