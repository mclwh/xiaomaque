import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import { getCanvasNodeDimensions } from "@/components/canvas/canvasNodeConfig";
import {
    buildCanvasSpatialIndex,
    flowRectFromViewport,
    getCanvasNodeBounds,
    insertOrUpdateNode,
    removeNodeFromIndex,
    searchNodesInRect,
    shouldUseCanvasSpatialIndex,
} from "@/lib/canvasSpatialIndex";
import { CANVAS_SPATIAL_INDEX_THRESHOLD } from "@/lib/canvasConfig";
import type { CanvasAssetNodeData } from "@/store/types/canvas";

// buildTestNode 构造测试节点
function buildTestNode(
    id: string,
    x: number,
    y: number,
    kind: CanvasAssetNodeData["kind"] = "character",
): Node<CanvasAssetNodeData> {
    const dimensions = getCanvasNodeDimensions(kind);

    return {
        id,
        type: "canvasAsset",
        position: { x, y },
        width: dimensions.width,
        height: dimensions.height,
        data: {
            assetId: Number(id.replace("asset-", "")),
            kind,
            label: "测试",
        },
    };
}

describe("canvasSpatialIndex", () => {
    it("shouldUseCanvasSpatialIndex 在阈值边界正确", () => {
        expect(shouldUseCanvasSpatialIndex(CANVAS_SPATIAL_INDEX_THRESHOLD)).toBe(false);
        expect(shouldUseCanvasSpatialIndex(CANVAS_SPATIAL_INDEX_THRESHOLD + 1)).toBe(true);
    });

    it("getCanvasNodeBounds 使用 position 与预设尺寸", () => {
        const node = buildTestNode("asset-1", 100, 50);
        const bounds = getCanvasNodeBounds(node);

        expect(bounds.minX).toBe(100);
        expect(bounds.minY).toBe(50);
        expect(bounds.maxX).toBe(100 + (node.width ?? 0));
        expect(bounds.maxY).toBe(50 + (node.height ?? 0));
    });

    it("searchNodesInRect 返回相交节点", () => {
        const index = buildCanvasSpatialIndex([
            buildTestNode("asset-1", 0, 0),
            buildTestNode("asset-2", 500, 500),
        ]);

        const hits = searchNodesInRect(index, { minX: -10, minY: -10, maxX: 300, maxY: 400 });

        expect(hits).toEqual(["asset-1"]);
    });

    it("insertOrUpdateNode 与 removeNodeFromIndex 增量维护", () => {
        const index = buildCanvasSpatialIndex([buildTestNode("asset-1", 0, 0)]);

        insertOrUpdateNode(index, buildTestNode("asset-1", 200, 0));
        expect(searchNodesInRect(index, { minX: 150, minY: -10, maxX: 450, maxY: 400 })).toEqual([
            "asset-1",
        ]);

        removeNodeFromIndex(index, "asset-1");
        expect(searchNodesInRect(index, { minX: -10, minY: -10, maxX: 1000, maxY: 1000 })).toEqual([]);
    });

    it("flowRectFromViewport 随 zoom 变换查询范围", () => {
        const rect = flowRectFromViewport({ x: 0, y: 0, zoom: 2 }, 800, 600, 0);

        expect(rect.minX).toBeCloseTo(0);
        expect(rect.minY).toBeCloseTo(0);
        expect(rect.maxX).toBe(400);
        expect(rect.maxY).toBe(300);
    });
});
