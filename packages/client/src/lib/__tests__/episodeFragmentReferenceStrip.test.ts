import { describe, expect, it } from "vitest";
import { buildEpisodeFragmentReferenceStripItems } from "@/lib/episodeFragmentReferenceStrip";
import type { ProjectAsset } from "@/api/asset";

function createAsset(partial: Partial<ProjectAsset> & Pick<ProjectAsset, "id">): ProjectAsset {
    return {
        projectId: 1,
        type: "character",
        assetType: "image",
        name: "测试资产",
        cover: "/xiaomaque/cover.jpg",
        url: null,
        params: null,
        deriveId: null,
        serieIds: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...partial,
    };
}

describe("buildEpisodeFragmentReferenceStripItems", () => {
    it("按 reference 顺序生成缩略图条", () => {
        const assets = [
            createAsset({ id: 1, name: "场景A", type: "scene", cover: "/a.jpg" }),
            createAsset({ id: 2, name: "孙悟空", type: "character", cover: "/b.jpg" }),
        ];
        const reference = [
            { assetId: 1, url: "/a.jpg", type: "scene" },
            {
                assetId: 2,
                url: "/b.jpg",
                type: "character",
                characterName: "孙悟空",
                appearanceName: "基础形象",
            },
        ];

        const items = buildEpisodeFragmentReferenceStripItems(reference, assets);

        expect(items).toHaveLength(2);
        expect(items[0]?.label).toBe("场景A");
        expect(items[1]?.label).toBe("孙悟空·基础形象");
        expect(items[0]?.previewUrl).toContain("imageView2");
    });
});
