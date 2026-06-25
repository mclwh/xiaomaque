import { describe, expect, it } from "vitest";
import {
    buildCanvasAssetFolderDisplayGroups,
    buildCanvasAssetFolderTabCounts,
    filterCanvasAssetsByTab,
} from "@/lib/canvasAssetFolder";
import type { ProjectAsset } from "@/api/asset";

function createAsset(partial: Partial<ProjectAsset> & Pick<ProjectAsset, "id" | "type">): ProjectAsset {
    return {
        projectId: 1,
        name: "测试资产",
        assetType: "image",
        url: null,
        cover: null,
        deriveId: null,
        serieIds: [],
        params: null,
        ...partial,
    };
}

describe("canvasAssetFolder", () => {
    it("按 Tab 筛选资产类型", () => {
        const assets = [
            createAsset({ id: 1, type: "character" }),
            createAsset({ id: 2, type: "scene" }),
            createAsset({ id: 3, type: "character", deriveId: "d1" }),
        ];

        expect(filterCanvasAssetsByTab(assets, "character")).toHaveLength(2);
        expect(filterCanvasAssetsByTab(assets, "prop")).toHaveLength(0);
    });

    it("统计各 Tab 展示分组数量", () => {
        const assets = [
            createAsset({ id: 1, type: "character", deriveId: "role-1" }),
            createAsset({ id: 2, type: "character", deriveId: "role-1" }),
            createAsset({ id: 3, type: "scene" }),
        ];

        expect(buildCanvasAssetFolderTabCounts(assets)).toEqual({
            character: 1,
            scene: 1,
            prop: 0,
            material: 0,
        });
    });

    it("同 derive_id 资产合并为一个展示分组", () => {
        const assets = [
            createAsset({ id: 1, type: "character", deriveId: "role-1", name: "孙悟空" }),
            createAsset({ id: 2, type: "character", deriveId: "role-1", name: "孙悟空" }),
        ];

        const groups = buildCanvasAssetFolderDisplayGroups(assets, "character");

        expect(groups).toHaveLength(1);
        expect(groups[0]?.totalCount).toBe(2);
        expect(groups[0]?.representativeAsset.id).toBe(1);
    });
});
