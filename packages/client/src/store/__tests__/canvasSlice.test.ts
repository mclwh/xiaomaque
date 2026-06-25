import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import type { ProjectAsset } from "@/api/asset";
import { readAssetVoiceAudio } from "@/lib/assetParams";
import {
    applyCanvasLibraryMedia,
    bindAudioToCharacters,
    canvasReducer,
    focusCanvasAsset,
    pushCanvasHistorySnapshot,
    redoCanvas,
    selectCanRedo,
    selectCanUndo,
    selectShowNodeEditorPanel,
    setSelectionViaBox,
    undoCanvas,
    updateCharacterAssetProfile,
} from "@/store/canvasSlice";
import {
    createTestCanvasState,
    getCanvasAssetsFromState,
} from "@/store/__tests__/canvasTestState";

// createTestStore 创建仅含 canvas reducer 的测试 Store
function createTestStore() {
    return configureStore({
        reducer: { canvas: canvasReducer },
    });
}

// buildTestAsset 构造测试用资产
function buildTestAsset(partial: Partial<ProjectAsset> & Pick<ProjectAsset, "id">): ProjectAsset {
    return {
        type: "character",
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

describe("canvasSlice selection", () => {
    it("setSelectionViaBox(true) 时 selectShowNodeEditorPanel 为 false", () => {
        const store = createTestStore();

        store.dispatch(setSelectionViaBox(true));

        expect(selectShowNodeEditorPanel(store.getState())).toBe(false);
    });

    it("setSelectionViaBox(false) 时 selectShowNodeEditorPanel 为 true", () => {
        const store = createTestStore();

        store.dispatch(setSelectionViaBox(false));

        expect(selectShowNodeEditorPanel(store.getState())).toBe(true);
    });
});

describe("canvasSlice history", () => {
    it("pushCanvasHistorySnapshot 后 past +1 且 future 清空", () => {
        const store = createTestStore();
        const initialNodes = store.getState().canvas.nodes;

        store.dispatch(pushCanvasHistorySnapshot());

        expect(store.getState().canvas.history.past).toHaveLength(1);
        expect(store.getState().canvas.history.future).toHaveLength(0);
        expect(selectCanUndo(store.getState())).toBe(true);
        expect(store.getState().canvas.nodes).toEqual(initialNodes);
    });

    it("undoCanvas 恢复 past 快照并标记 layoutDirty", () => {
        const store = createTestStore();

        store.dispatch(setSelectionViaBox(true));
        store.dispatch(pushCanvasHistorySnapshot());
        store.dispatch(setSelectionViaBox(false));

        store.dispatch(undoCanvas());

        expect(selectShowNodeEditorPanel(store.getState())).toBe(true);
        expect(store.getState().canvas.layoutDirty).toBe(true);
        expect(selectCanRedo(store.getState())).toBe(true);
    });

    it("redoCanvas 恢复 future 快照", () => {
        const store = createTestStore();

        store.dispatch(setSelectionViaBox(true));
        store.dispatch(pushCanvasHistorySnapshot());
        store.dispatch(setSelectionViaBox(false));
        store.dispatch(undoCanvas());
        store.dispatch(redoCanvas());

        expect(store.getState().canvas.layoutDirty).toBe(true);
        expect(selectCanRedo(store.getState())).toBe(false);
        expect(selectCanUndo(store.getState())).toBe(true);
    });

    it("undoCanvas 恢复绑定前的 assets params", () => {
        const characterBefore = buildTestAsset({ id: 1, params: null });
        const characterAfter = buildTestAsset({
            id: 1,
            params: {
                canvas: {
                    voiceAudio: { sourceAssetId: 2, url: "audio.mp3" },
                },
            },
        });
        const audioAfter = buildTestAsset({
            id: 2,
            type: "none",
            assetType: "audio",
            url: "audio.mp3",
            params: {
                canvas: {
                    audioCharacterBinding: {
                        mode: "single",
                        characterAssetIds: [1],
                    },
                },
            },
        });

        let state = createTestCanvasState({
            assets: [characterBefore],
        });
        state = canvasReducer(state, pushCanvasHistorySnapshot());
        state = canvasReducer(
            state,
            bindAudioToCharacters.fulfilled(
                { savedAssets: [characterAfter, audioAfter] },
                "request-id",
                {
                    audioAssetId: 2,
                    characterAssetIds: [1],
                    bindMode: "single",
                },
            ),
        );

        expect(readAssetVoiceAudio(getCanvasAssetsFromState(state)[0]?.params)).not.toBeNull();

        state = canvasReducer(state, undoCanvas());

        expect(readAssetVoiceAudio(getCanvasAssetsFromState(state)[0]?.params)).toBeNull();
    });
});

describe("canvasSlice applyCanvasLibraryMedia", () => {
    it("fulfilled 时同步更新 assets 与节点 mediaUrl", () => {
        const initialAsset = buildTestAsset({ id: 1, url: "old.jpg", cover: "old.jpg" });
        const updatedAsset = buildTestAsset({ id: 1, url: "new.jpg", cover: "new.jpg" });
        const baseState = createTestCanvasState({
            assets: [initialAsset],
            nodes: [
                {
                    id: "asset-1",
                    type: "asset",
                    position: { x: 0, y: 0 },
                    data: {
                        assetId: 1,
                        kind: "character",
                        label: "角色",
                        mediaUrl: "old.jpg",
                    },
                },
            ],
        });

        const nextState = canvasReducer(
            baseState,
            applyCanvasLibraryMedia.fulfilled(
                {
                    assetId: 1,
                    asset: updatedAsset,
                },
                "request-id",
                {
                    targetAssetId: 1,
                    sourceAssetId: 2,
                },
            ),
        );

        expect(getCanvasAssetsFromState(nextState)[0]?.url).toBe("new.jpg");
        expect(nextState.nodes[0]?.data.mediaUrl).toBe("new.jpg");
        expect(nextState.saveStatusVisible).toBe(true);
        expect(nextState.errorMessage).toBe("");
    });
});

describe("canvasSlice updateCharacterAssetProfile", () => {
    it("fulfilled 时同步更新资产名称、角色名与出现集数", () => {
        const initialAsset = buildTestAsset({
            id: 1,
            name: "基础形象",
            params: null,
            serieIds: [],
        });
        const updatedAsset = buildTestAsset({
            id: 1,
            name: "主角",
            params: { canvas: { appearanceName: "战斗形象" } },
            serieIds: [1, 2],
        });
        const baseState = createTestCanvasState({
            assets: [initialAsset],
            nodes: [
                {
                    id: "asset-1",
                    type: "asset",
                    position: { x: 0, y: 0 },
                    data: {
                        assetId: 1,
                        kind: "character",
                        label: "基础形象",
                        mediaUrl: null,
                    },
                },
            ],
        });

        const nextState = canvasReducer(
            baseState,
            updateCharacterAssetProfile.fulfilled(
                { savedAssets: [updatedAsset] },
                "request-id",
                {
                    assetId: 1,
                    characterName: "主角",
                    appearanceName: "战斗形象",
                    serieIds: [1, 2],
                },
            ),
        );

        expect(getCanvasAssetsFromState(nextState)[0]?.name).toBe("主角");
        expect(getCanvasAssetsFromState(nextState)[0]?.params?.canvas?.appearanceName).toBe(
            "战斗形象",
        );
        expect(getCanvasAssetsFromState(nextState)[0]?.serieIds).toEqual([1, 2]);
        expect(nextState.nodes[0]?.data.label).toBe("战斗形象");
        expect(nextState.nodes[0]?.data.characterName).toBe("主角");
        expect(nextState.saveStatusVisible).toBe(true);
    });
});

describe("canvasSlice focusCanvasAsset", () => {
    it("201 节点时仅变更选中相关节点引用", () => {
        const nodes = Array.from({ length: 201 }, (_, index) => ({
            id: `asset-${index + 1}`,
            type: "canvasAsset" as const,
            position: { x: index * 10, y: 0 },
            selected: index === 0,
            data: {
                assetId: index + 1,
                kind: "character" as const,
                label: "角色",
            },
        }));

        const baseState = createTestCanvasState({ nodes });
        const nextState = canvasReducer(baseState, focusCanvasAsset(201));

        let unchangedCount = 0;
        for (let i = 0; i < nodes.length; i += 1) {
            if (nextState.nodes[i] === nodes[i]) {
                unchangedCount += 1;
            }
        }

        expect(unchangedCount).toBeGreaterThanOrEqual(199);
        expect(nextState.nodes[200]?.selected).toBe(true);
    });
});
