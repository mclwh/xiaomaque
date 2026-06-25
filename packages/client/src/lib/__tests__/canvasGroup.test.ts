import { describe, expect, it } from "vitest";
import type { ProjectAsset } from "@/api/asset";
import {
    collectReferenceSourceImageUrls,
    resolveAssetDeriveId,
    resolveAssetReferenceImageUrl,
    resolveDerivePeerAssets,
    resolveReferenceSourceAssetId,
    resolveReferenceSourceDisplay,
} from "@/lib/canvasGroup";

// buildAsset 构造测试用资产
function buildAsset(overrides: Partial<ProjectAsset> = {}): ProjectAsset {
    return {
        id: 1,
        type: "character",
        assetType: "image",
        name: "角色",
        cover: "cover-key",
        url: "url-key",
        params: null,
        projectId: 1,
        deriveId: null,
        serieIds: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...overrides,
    };
}

describe("canvasGroup", () => {
    it("resolveAssetDeriveId 读取 deriveId", () => {
        expect(resolveAssetDeriveId(buildAsset({ deriveId: "Ab12Cd34Ef" }))).toBe("Ab12Cd34Ef");
        expect(resolveAssetDeriveId(buildAsset({ deriveId: null }))).toBeNull();
    });

    it("resolveDerivePeerAssets 返回同衍生组其他资产", () => {
        const assets = [
            buildAsset({ id: 10, deriveId: "derive1234" }),
            buildAsset({ id: 20, deriveId: "derive1234" }),
        ];

        expect(resolveDerivePeerAssets(assets, assets[0]).map((item) => item.id)).toEqual([20]);
    });

    it("resolveReferenceSourceAssetId 读取 params.canvas.referenceSourceAssetId", () => {
        expect(
            resolveReferenceSourceAssetId(
                buildAsset({
                    params: { canvas: { referenceSourceAssetId: 10 } },
                }),
            ),
        ).toBe(10);
        expect(resolveReferenceSourceAssetId(buildAsset())).toBeNull();
    });

    it("collectReferenceSourceImageUrls 仅返回直接来源节点图片", () => {
        const assets = [
            buildAsset({ id: 10, deriveId: "derive1234", url: "source-url" }),
            buildAsset({
                id: 20,
                deriveId: "derive1234",
                url: "peer-url",
                params: { canvas: { referenceSourceAssetId: 10 } },
            }),
            buildAsset({ id: 30, deriveId: "derive1234", url: "other-url" }),
        ];

        expect(collectReferenceSourceImageUrls(assets, assets[1])).toEqual(["source-url"]);
    });

    it("resolveReferenceSourceDisplay 返回直接来源展示信息", () => {
        const assets = [
            buildAsset({ id: 10, url: "source-url", name: "源节点" }),
            buildAsset({
                id: 20,
                params: { canvas: { referenceSourceAssetId: 10 } },
            }),
        ];

        expect(resolveReferenceSourceDisplay(assets, assets[1])).toEqual({
            asset: assets[0],
            imageUrl: "source-url",
        });
        expect(resolveAssetReferenceImageUrl(null)).toBeNull();
    });
});
