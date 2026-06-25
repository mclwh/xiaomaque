import { describe, expect, it } from "vitest";
import type { ProjectAsset } from "@/api/asset";
import { buildAssetsIndex, upsertAssetInIndex } from "@/lib/canvasAssetsIndex";
import { createSelector } from "@reduxjs/toolkit";
import type { CanvasState } from "@/store/types/canvas";

// buildAsset 构造测试资产
function buildAsset(id: number): ProjectAsset {
    return {
        id,
        type: "character",
        assetType: "image",
        name: `资产${id}`,
        cover: null,
        url: null,
        params: null,
        projectId: 1,
        deriveId: null,
        serieIds: [],
        createdAt: "",
        updatedAt: "",
    };
}

// selectAssetById 测试用 selector（与 canvasSlice 同结构）
const selectAssetById = createSelector(
    [
        (state: { canvas: CanvasState }) => state.canvas.assetsById,
        (_state: { canvas: CanvasState }, assetId: number) => assetId,
    ],
    (assetsById, assetId) => assetsById[assetId] ?? null,
);

describe("canvas assetsById", () => {
    it("buildAssetsIndex 构建 id 映射", () => {
        const index = buildAssetsIndex([buildAsset(1), buildAsset(2)]);

        expect(index.assetIds).toEqual([1, 2]);
        expect(index.assetsById[1]?.name).toBe("资产1");
    });

    it("upsertAssetInIndex 仅替换变更资产引用", () => {
        const initial = buildAssetsIndex([buildAsset(1), buildAsset(2)]);
        const updated = upsertAssetInIndex(initial, { ...buildAsset(1), name: "更新" });

        expect(updated.assetsById[1]?.name).toBe("更新");
        expect(updated.assetsById[2]).toBe(initial.assetsById[2]);
    });

    it("selectAssetById 更新 A 不影响 B 的输出引用", () => {
        const stateA: { canvas: CanvasState } = {
            canvas: {
                ...({} as CanvasState),
                assetsById: { 1: buildAsset(1), 2: buildAsset(2) },
                assetIds: [1, 2],
            },
        };
        const beforeB = selectAssetById(stateA, 2);

        const nextIndex = upsertAssetInIndex(
            { assetsById: stateA.canvas.assetsById, assetIds: stateA.canvas.assetIds },
            { ...buildAsset(1), name: "变更" },
        );
        const stateB: { canvas: CanvasState } = {
            canvas: {
                ...stateA.canvas,
                assetsById: nextIndex.assetsById,
                assetIds: nextIndex.assetIds,
            },
        };
        const afterB = selectAssetById(stateB, 2);

        expect(afterB).toBe(beforeB);
        expect(selectAssetById(stateB, 1)?.name).toBe("变更");
    });
});
