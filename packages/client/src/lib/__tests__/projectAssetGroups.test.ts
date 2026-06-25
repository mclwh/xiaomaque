import { describe, expect, it } from "vitest";
import type { ProjectAsset } from "@/api/asset";
import {
    countProjectAssetDisplayGroups,
    formatProjectAssetGroupSummary,
    groupProjectAssetsForDisplay,
} from "@/lib/projectAssetGroups";

// buildAsset 构造测试用资产
function buildAsset(overrides: Partial<ProjectAsset> = {}): ProjectAsset {
    return {
        id: 1,
        type: "character",
        assetType: "image",
        name: "角色",
        cover: "cover-key",
        url: null,
        params: null,
        projectId: 1,
        deriveId: null,
        serieIds: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...overrides,
    };
}

describe("projectAssetGroups", () => {
    it("groupProjectAssetsForDisplay 合并相同 derive_id", () => {
        const assets = [
            buildAsset({ id: 10, deriveId: "abc1234567", cover: "cover-a" }),
            buildAsset({ id: 20, deriveId: "abc1234567", cover: null }),
            buildAsset({ id: 30, deriveId: null, name: "独立角色" }),
        ];

        const groups = groupProjectAssetsForDisplay(assets);

        expect(groups).toHaveLength(2);
        expect(groups[0].totalCount).toBe(2);
        expect(groups[0].representativeAsset.id).toBe(10);
        expect(groups[1].totalCount).toBe(1);
    });

    it("countProjectAssetDisplayGroups 返回合并后的数量", () => {
        const assets = [
            buildAsset({ id: 10, deriveId: "abc1234567" }),
            buildAsset({ id: 20, deriveId: "abc1234567" }),
            buildAsset({ id: 30, deriveId: null }),
        ];

        expect(countProjectAssetDisplayGroups(assets)).toBe(2);
    });

    it("formatProjectAssetGroupSummary 单个资产也展示数量信息", () => {
        const group = groupProjectAssetsForDisplay([
            buildAsset({ id: 30, deriveId: null, cover: "cover-b" }),
        ])[0];

        expect(formatProjectAssetGroupSummary("character", group)).toBe("1 个形象");
    });
});
