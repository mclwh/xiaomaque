import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import {
    canvasReducer,
    pushCanvasHistorySnapshot,
    stageCanvasNodesRemoval,
    undoCanvas,
} from "@/store/canvasSlice";
import { createTestCanvasState } from "@/store/__tests__/canvasTestState";

const sampleCanvasState = createTestCanvasState({
    assets: [
        {
            id: 1,
            type: "character",
            assetType: "character",
            name: "角色",
            cover: null,
            url: null,
            params: {},
            projectId: 1,
            deriveId: null,
            serieIds: [],
            createdAt: "",
            updatedAt: "",
        },
    ],
    nodes: [
        {
            id: "asset-1",
            type: "canvasAsset",
            position: { x: 0, y: 0 },
            data: { assetId: 1, kind: "character", label: "角色" },
        },
        {
            id: "asset-2",
            type: "canvasAsset",
            position: { x: 240, y: 0 },
            data: { assetId: 2, kind: "character", label: "角色2" },
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

describe("canvasSlice pending deletes", () => {
    it("stageCanvasNodesRemoval 仅本地移除节点并暂存 ID", () => {
        const store = createTestStore();

        store.dispatch(stageCanvasNodesRemoval([2]));

        const state = store.getState().canvas;
        expect(state.nodes).toHaveLength(1);
        expect(state.nodes[0].data.assetId).toBe(1);
        expect(state.pendingDeleteAssetIds).toEqual([2]);
        expect(state.layoutDirty).toBe(true);
    });

    it("撤销删除后恢复节点并清空对应暂存 ID", () => {
        const store = createTestStore();

        store.dispatch(pushCanvasHistorySnapshot());
        store.dispatch(stageCanvasNodesRemoval([2]));
        store.dispatch(undoCanvas());

        const state = store.getState().canvas;
        expect(state.nodes).toHaveLength(2);
        expect(state.pendingDeleteAssetIds).toEqual([]);
    });
});
