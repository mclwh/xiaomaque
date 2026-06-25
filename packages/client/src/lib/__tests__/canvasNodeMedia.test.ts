import { describe, expect, it } from "vitest";
import type { ProjectAsset } from "@/api/asset";
import {
    filterAssetsByLibraryTab,
    filterBindableAudioAssets,
    getCanvasNodeMediaConfig,
    isCanvasImageUploadNodeKind,
} from "@/lib/canvasNodeMedia";
import { IMAGE_MAX_FILE_SIZE, isValidImageFile } from "@/lib/imageUpload";

// 构造测试用资产
function buildAsset(partial: Partial<ProjectAsset> & Pick<ProjectAsset, "id">): ProjectAsset {
    return {
        type: "none",
        assetType: "image",
        name: null,
        cover: null,
        url: null,
        params: null,
        projectId: 1,
        deriveId: null,
        serieIds: [],
        createdAt: "",
        updatedAt: "",
        ...partial,
    };
}

describe("canvasNodeMedia", () => {
    it("角色节点资产库 Tab 包含角色与素材", () => {
        const config = getCanvasNodeMediaConfig("character");

        expect(config.accept).toBe("image/*");
        expect(config.libraryTabs.map((tab) => tab.key)).toEqual(["character", "material"]);
    });

    it("filterAssetsByLibraryTab 按节点类型筛选图片资产", () => {
        const assets = [
            buildAsset({ id: 1, type: "character", url: "c.jpg" }),
            buildAsset({ id: 2, type: "scene", url: "s.jpg" }),
            buildAsset({ id: 3, type: "material", assetType: "image", url: "m.jpg" }),
            buildAsset({ id: 4, type: "material", assetType: "audio", url: "a.mp3" }),
            buildAsset({ id: 5, type: "none", assetType: "image", url: "i.jpg" }),
            buildAsset({ id: 6, type: "character", url: null }),
        ];

        expect(filterAssetsByLibraryTab(assets, "character", 1).map((item) => item.id)).toEqual([]);
        expect(filterAssetsByLibraryTab(assets, "character").map((item) => item.id)).toEqual([1]);
        expect(filterAssetsByLibraryTab(assets, "scene").map((item) => item.id)).toEqual([2]);
        expect(filterAssetsByLibraryTab(assets, "material").map((item) => item.id)).toEqual([3]);
        expect(filterAssetsByLibraryTab(assets, "canvas-image").map((item) => item.id)).toEqual([5]);
    });

    it("filterBindableAudioAssets 识别画布音频节点并排除无 url 项", () => {
        const assets = [
            buildAsset({ id: 1, type: "none", assetType: "audio", url: "a.mp3" }),
            buildAsset({ id: 2, type: "none", assetType: "audio", url: null }),
            buildAsset({ id: 3, type: "none", assetType: "image", url: "i.jpg" }),
        ];

        expect(filterBindableAudioAssets(assets).map((item) => item.id)).toEqual([1]);
    });

    it("isCanvasImageUploadNodeKind 仅匹配图片类节点", () => {
        expect(isCanvasImageUploadNodeKind("character")).toBe(true);
        expect(isCanvasImageUploadNodeKind("video")).toBe(false);
    });
});

describe("imageUpload", () => {
    it("isValidImageFile 拒绝非图片与超大文件", () => {
        const validFile = new File(["x"], "photo.jpg", { type: "image/jpeg" });
        const invalidType = new File(["x"], "audio.mp3", { type: "audio/mpeg" });
        const oversized = new File([new ArrayBuffer(IMAGE_MAX_FILE_SIZE + 1)], "big.jpg", {
            type: "image/jpeg",
        });

        expect(isValidImageFile(validFile)).toBe(true);
        expect(isValidImageFile(invalidType)).toBe(false);
        expect(isValidImageFile(oversized)).toBe(false);
    });
});
