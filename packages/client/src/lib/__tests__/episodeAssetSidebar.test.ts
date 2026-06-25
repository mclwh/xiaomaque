import { describe, expect, it } from "vitest";
import type { ProjectAsset } from "@/api/asset";
import {
    buildEpisodeAssetSidebarSections,
    filterAssetsByEpisodeScope,
    isAssetInEpisodeScope,
} from "@/lib/episodeAssetSidebar";

// createAsset 构造测试资产
function createAsset(partial: Partial<ProjectAsset> & Pick<ProjectAsset, "id" | "type">): ProjectAsset {
    return {
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

describe("isAssetInEpisodeScope", () => {
    it("未绑定分集时不属于本集范围", () => {
        expect(isAssetInEpisodeScope(createAsset({ id: 1, type: "character", serieIds: [] }), 3)).toBe(
            false,
        );
    });

    it("绑定分集时仅对应分集可见", () => {
        const asset = createAsset({ id: 1, type: "character", serieIds: [2, 3] });

        expect(isAssetInEpisodeScope(asset, 3)).toBe(true);
        expect(isAssetInEpisodeScope(asset, 5)).toBe(false);
    });
});

describe("filterAssetsByEpisodeScope", () => {
    it("全集范围返回全部资产", () => {
        const assets = [
            createAsset({ id: 1, type: "character", serieIds: [2] }),
            createAsset({ id: 2, type: "scene", serieIds: [9] }),
        ];

        expect(filterAssetsByEpisodeScope(assets, 2, "series")).toHaveLength(2);
    });

    it("本集范围仅保留当前分集资产", () => {
        const assets = [
            createAsset({ id: 1, type: "character", serieIds: [2] }),
            createAsset({ id: 2, type: "scene", serieIds: [9] }),
            createAsset({ id: 3, type: "prop", serieIds: [] }),
        ];

        expect(filterAssetsByEpisodeScope(assets, 2, "episode").map((asset) => asset.id)).toEqual([1]);
    });
});

describe("buildEpisodeAssetSidebarSections", () => {
    it("按分类生成分组区块", () => {
        const assets = [
            createAsset({ id: 1, type: "character", name: "孙悟空" }),
            createAsset({ id: 2, type: "scene", name: "妖界废墟" }),
        ];

        const sections = buildEpisodeAssetSidebarSections(assets, 1, "series", null);

        expect(sections.map((section) => section.tabKey)).toEqual(["character", "scene"]);
        expect(sections[0]?.groups).toHaveLength(1);
    });

    it("筛选单个分类时仅返回对应区块", () => {
        const assets = [
            createAsset({ id: 1, type: "character", name: "孙悟空" }),
            createAsset({ id: 2, type: "scene", name: "妖界废墟" }),
        ];

        const sections = buildEpisodeAssetSidebarSections(assets, 1, "series", "scene");

        expect(sections).toHaveLength(1);
        expect(sections[0]?.tabKey).toBe("scene");
    });
});
