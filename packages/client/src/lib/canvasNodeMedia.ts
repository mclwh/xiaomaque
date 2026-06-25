// 画布节点媒体上传与资产库筛选配置
import type { ProjectAsset } from "@/api/asset";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import type { StorageCategory } from "@/api/upload";
import { resolveCanvasNodeKind } from "@/lib/assetCategory";

// CanvasNodeMediaKind 支持图片上传/资产库选择的节点类型
export type CanvasNodeMediaKind = Extract<CanvasNodeKind, "character" | "scene" | "image">;

// CanvasLibraryTabKey 资产库选择弹窗 Tab
export type CanvasLibraryTabKey = "character" | "scene" | "material" | "canvas-image";

// CanvasLibraryTabConfig 资产库 Tab 配置
export type CanvasLibraryTabConfig = {
    key: CanvasLibraryTabKey;
    label: string;
};

// CanvasNodeMediaConfig 节点媒体上传配置
export type CanvasNodeMediaConfig = {
    accept: string;
    storageCategory: StorageCategory;
    libraryTabs: CanvasLibraryTabConfig[];
};

// 判断节点是否支持图片上传与资产库选择
export function isCanvasImageUploadNodeKind(kind: CanvasNodeKind): kind is CanvasNodeMediaKind {
    return kind === "character" || kind === "scene" || kind === "image";
}

// 返回节点对应的媒体上传配置
export function getCanvasNodeMediaConfig(kind: CanvasNodeMediaKind): CanvasNodeMediaConfig {
    if (kind === "character") {
        return {
            accept: "image/*",
            storageCategory: "image",
            libraryTabs: [
                { key: "character", label: "角色" },
                { key: "material", label: "素材" },
            ],
        };
    }

    if (kind === "scene") {
        return {
            accept: "image/*",
            storageCategory: "image",
            libraryTabs: [
                { key: "scene", label: "场景" },
                { key: "material", label: "素材" },
            ],
        };
    }

    return {
        accept: "image/*",
        storageCategory: "image",
        libraryTabs: [
            { key: "material", label: "素材" },
            { key: "canvas-image", label: "画布图片" },
        ],
    };
}

// 判断资产是否包含可绑定的图片媒体
export function hasAssetImageMedia(asset: Pick<ProjectAsset, "url" | "cover">) {
    return Boolean(asset.url || asset.cover);
}

// 判断素材库资产是否为图片类型
export function isMaterialImageAsset(asset: Pick<ProjectAsset, "type" | "assetType">) {
    return asset.type === "material" && asset.assetType === "image";
}

// 判断是否为画布上的图片节点资产
export function isCanvasImageAsset(asset: Pick<ProjectAsset, "type" | "assetType">) {
    return asset.type === "none" && asset.assetType === "image";
}

// 按 Tab 筛选资产库候选项
export function filterAssetsByLibraryTab(
    assets: ProjectAsset[],
    tabKey: CanvasLibraryTabKey,
    excludeAssetId?: number,
) {
    return assets.filter((asset) => {
        if (excludeAssetId !== undefined && asset.id === excludeAssetId) {
            return false;
        }

        if (!hasAssetImageMedia(asset)) {
            return false;
        }

        if (tabKey === "character") {
            return asset.type === "character";
        }

        if (tabKey === "scene") {
            return asset.type === "scene";
        }

        if (tabKey === "material") {
            return isMaterialImageAsset(asset);
        }

        return isCanvasImageAsset(asset);
    });
}

// 解析资产库展示用预览 key
export function resolveAssetLibraryPreviewKey(asset: Pick<ProjectAsset, "cover" | "url">) {
    return asset.cover ?? asset.url;
}

// 筛选画布中可绑定的音频资产（画布音频节点 type 为 none，需用 assetType 识别）
export function filterBindableAudioAssets(assets: ProjectAsset[]) {
    return assets.filter(
        (asset) => resolveCanvasNodeKind(asset) === "audio" && Boolean(asset.url),
    );
}
