import { describe, expect, it } from "vitest";
import { mergePendingDeleteAssetIds } from "@/lib/canvasPendingDeletes";

describe("canvasPendingDeletes", () => {
    it("mergePendingDeleteAssetIds 合并并去重待删除 ID", () => {
        expect(mergePendingDeleteAssetIds([1, 2], [2, 3])).toEqual([1, 2, 3]);
    });

    it("mergePendingDeleteAssetIds 空数组时返回原列表", () => {
        expect(mergePendingDeleteAssetIds([5], [])).toEqual([5]);
    });
});
