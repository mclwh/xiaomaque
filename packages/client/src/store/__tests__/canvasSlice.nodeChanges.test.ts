import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import type { NodeChange } from "@xyflow/react";
import {
    canvasReducer,
    commitNodePositions,
    nodesChanged,
} from "@/store/canvasSlice";
import { createTestCanvasState } from "@/store/__tests__/canvasTestState";

const sampleCanvasState = createTestCanvasState({
    nodes: [
        {
            id: "asset-1",
            type: "canvasAsset",
            position: { x: 0, y: 0 },
            data: { assetId: 1, kind: "character", label: "角色" },
        },
    ],
});

// createTestStore 创建带初始节点的测试 Store
function createTestStore() {
    return configureStore({
        reducer: { canvas: canvasReducer },
        preloadedState: { canvas: sampleCanvasState },
    });
}

describe("canvasSlice node changes", () => {
    it("commitNodePositions 更新位置并标记 layoutDirty", () => {
        const store = createTestStore();

        const changes: NodeChange[] = [
            { id: "asset-1", type: "position", position: { x: 100, y: 200 }, dragging: false },
        ];

        store.dispatch(commitNodePositions(changes));

        const node = store.getState().canvas.nodes.find((item) => item.id === "asset-1");
        expect(node?.position).toEqual({ x: 100, y: 200 });
        expect(store.getState().canvas.layoutDirty).toBe(true);
    });

    it("nodesChanged 中 dragging position 不标记 layoutDirty", () => {
        const store = createTestStore();

        store.dispatch(
            nodesChanged([
                { id: "asset-1", type: "position", position: { x: 50, y: 50 }, dragging: true },
            ]),
        );

        expect(store.getState().canvas.layoutDirty).toBe(false);
    });
});
