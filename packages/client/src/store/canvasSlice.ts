// 画布 Redux Slice：资产列表与 React Flow 节点/边状态
import { createSlice, current, type PayloadAction } from "@reduxjs/toolkit";
import {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    type Connection,
    type EdgeChange,
    type NodeChange,
} from "@xyflow/react";
import {
    appendCanvasNode,
    appendContextCanvasNode,
    appendReferencedCanvasNode,
    buildCanvasNodes,
    getCanvasNodeId,
    isSameCanvasLayout,
    removeCanvasNodesByAssetIds,
    restoreCanvasEdges,
    serializeCanvasLayout,
    createEmptyEdges,
} from "@/lib/canvasNodes";
import { createEmptyCanvasHistory, pushHistory, redoHistory, undoHistory } from "@/lib/canvasHistory";
import { mergePendingDeleteAssetIds } from "@/lib/canvasPendingDeletes";
import { buildCanvasFlowEdge } from "@/lib/canvasEdges";
import { hasLayoutNodeChange } from "@/lib/canvasNodeChanges";
import { focusNodeSelection } from "@/lib/canvasNodeSelection";
import {
    applyAssetMediaUpdateToState,
    applyCharacterProfileUpdatesToState,
    getCanvasAssetsList,
    mergeCanvasAssets,
    removeCanvasAssetsByIds,
    setCanvasAssets,
    syncCanvasNodeIndexes,
    upsertCanvasAsset,
} from "@/lib/canvasStateHelpers";
import type { CanvasState } from "@/store/types/canvas";
import {
    applyCanvasLibraryMedia,
    bindAudioToCharacters,
    clearCanvasAssetReference,
    createCanvasAsset,
    createContextCanvasAsset,
    createReferencedCanvasAsset,
    deleteCanvasAssets,
    generateCanvasImage,
    loadCanvasAssets,
    loadCanvasSeries,
    markCanvasAssetAsMaterial,
    saveCanvasAudioReferenceFiles,
    saveCanvasLayout,
    submitCanvasAudioPrompt,
    unbindCharacterVoiceAudio,
    updateCharacterAssetProfile,
    uploadCanvasAudioMedia,
    uploadCanvasImageMedia,
} from "@/store/canvasThunks";

// AUTO_SAVE_DEBOUNCE_MS 编辑后触发保存的防抖延迟
export const AUTO_SAVE_DEBOUNCE_MS = 2000;

// SAVE_STATUS_VISIBLE_MS 保存成功后「已保存」提示显示时长
export const SAVE_STATUS_VISIBLE_MS = 2000;

// initialState 画布模块初始状态
const initialState: CanvasState = {
    projectId: null,
    assetsById: {},
    assetIds: [],
    series: [],
    seriesLoading: false,
    seriesLoaded: false,
    nodes: [],
    edges: createEmptyEdges(),
    nodeIdSet: {},
    nodeIndexByAssetId: {},
    assetsLoading: false,
    assetCreating: false,
    assetDeleting: false,
    canvasSaving: false,
    layoutDirty: false,
    saveStatusVisible: false,
    errorMessage: "",
    snapToGrid: false,
    showMinimap: false,
    selectionViaBox: false,
    pendingDeleteAssetIds: [],
    generatingAssetId: null,
    mediaImagePreview: null,
    history: createEmptyCanvasHistory(),
};

// 判断连线变更是否影响布局（需触发保存）
function hasLayoutEdgeChange(changes: EdgeChange[]) {
    return changes.some((change) => change.type !== "select");
}

// 构建当前画布快照（用于撤销/重做）
// 先用 current 将 Immer 草稿转为普通对象，再 structuredClone 深拷贝（性能优于 JSON 往返）
function buildCanvasSnapshot(state: CanvasState) {
    return {
        nodes: structuredClone(current(state.nodes)),
        edges: structuredClone(current(state.edges)),
        assets: getCanvasAssetsList(state),
        pendingDeleteAssetIds: [...state.pendingDeleteAssetIds],
    };
}

const canvasSlice = createSlice({
    name: "canvas",
    initialState,
    reducers: {
        // 重置画布状态
        resetCanvas() {
            return initialState;
        },
        // 同步 React Flow 节点变更（不含拖拽中的 position，由 commitNodePositions 处理）
        nodesChanged(state, action: PayloadAction<NodeChange[]>) {
            state.nodes = applyNodeChanges(action.payload, state.nodes) as typeof state.nodes;

            if (hasLayoutNodeChange(action.payload)) {
                state.layoutDirty = true;
            }
        },
        // 提交拖拽结束后的节点位置变更
        commitNodePositions(state, action: PayloadAction<NodeChange[]>) {
            state.nodes = applyNodeChanges(action.payload, state.nodes) as typeof state.nodes;
            state.layoutDirty = true;
        },
        // 同步 React Flow 边变更
        edgesChanged(state, action: PayloadAction<EdgeChange[]>) {
            state.edges = applyEdgeChanges(action.payload, state.edges);

            if (hasLayoutEdgeChange(action.payload)) {
                state.layoutDirty = true;
            }
        },
        // 连接节点时追加边
        edgeConnected(state, action: PayloadAction<Connection>) {
            state.edges = addEdge(buildCanvasFlowEdge(action.payload), state.edges);
            state.layoutDirty = true;
        },
        // 隐藏「已保存」提示
        hideSaveStatus(state) {
            state.saveStatusVisible = false;
        },
        // 切换网格吸附
        setSnapToGrid(state, action: PayloadAction<boolean>) {
            state.snapToGrid = action.payload;
        },
        // 切换小地图显示
        setShowMinimap(state, action: PayloadAction<boolean>) {
            state.showMinimap = action.payload;
        },
        // 切换网格吸附开关
        toggleSnapToGrid(state) {
            state.snapToGrid = !state.snapToGrid;
        },
        // 切换小地图开关
        toggleMinimap(state) {
            state.showMinimap = !state.showMinimap;
        },
        // 选中指定资产对应的画布节点
        focusCanvasAsset(state, action: PayloadAction<number>) {
            const targetNodeId = getCanvasNodeId(action.payload);
            state.nodes = focusNodeSelection(state.nodes, targetNodeId);
        },
        // 更新文本节点内容
        updateCanvasNodeTextContent(
            state,
            action: PayloadAction<{ nodeId: string; textContent: string }>,
        ) {
            const { nodeId, textContent } = action.payload;

            state.nodes = state.nodes.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, textContent } }
                    : node,
            );
            state.layoutDirty = true;
        },
        // 暂存待删除资产 ID 并从画布本地移除节点（不调用接口）
        stageCanvasNodesRemoval(state, action: PayloadAction<number[]>) {
            const assetIds = action.payload;

            if (assetIds.length === 0) {
                return;
            }

            state.pendingDeleteAssetIds = mergePendingDeleteAssetIds(
                state.pendingDeleteAssetIds,
                assetIds,
            );
            const next = removeCanvasNodesByAssetIds(state.nodes, state.edges, assetIds);
            state.nodes = next.nodes;
            state.edges = next.edges;
            syncCanvasNodeIndexes(state);
            state.layoutDirty = true;
        },
        // 设置框选标记（框选时不展示编辑面板）
        setSelectionViaBox(state, action: PayloadAction<boolean>) {
            state.selectionViaBox = action.payload;
        },
        // 将当前画布状态压入撤销栈
        pushCanvasHistorySnapshot(state) {
            state.history = pushHistory(state.history, buildCanvasSnapshot(state));
        },
        // 撤销画布变更
        undoCanvas(state) {
            const result = undoHistory(buildCanvasSnapshot(state), state.history);

            if (!result) {
                return;
            }

            state.history = result.history;
            state.nodes = result.snapshot.nodes;
            state.edges = result.snapshot.edges;
            setCanvasAssets(state, result.snapshot.assets);
            state.pendingDeleteAssetIds = result.snapshot.pendingDeleteAssetIds;
            syncCanvasNodeIndexes(state);
            state.layoutDirty = true;
        },
        // 重做画布变更
        redoCanvas(state) {
            const result = redoHistory(buildCanvasSnapshot(state), state.history);

            if (!result) {
                return;
            }

            state.history = result.history;
            state.nodes = result.snapshot.nodes;
            state.edges = result.snapshot.edges;
            setCanvasAssets(state, result.snapshot.assets);
            state.pendingDeleteAssetIds = result.snapshot.pendingDeleteAssetIds;
            syncCanvasNodeIndexes(state);
            state.layoutDirty = true;
        },
        // 打开画布全局图片预览
        openMediaImagePreview(
            state,
            action: PayloadAction<{ src: string; alt: string }>,
        ) {
            state.mediaImagePreview = action.payload;
        },
        // 关闭画布全局图片预览
        closeMediaImagePreview(state) {
            state.mediaImagePreview = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadCanvasAssets.pending, (state) => {
                state.assetsLoading = true;
                state.errorMessage = "";
            })
            .addCase(loadCanvasAssets.fulfilled, (state, action) => {
                state.assetsLoading = false;
                state.projectId = action.payload.projectId;
                setCanvasAssets(state, action.payload.assets);
                state.series = [];
                state.seriesLoading = false;
                state.seriesLoaded = false;
                state.nodes = buildCanvasNodes(action.payload.assets);
                state.edges = restoreCanvasEdges(action.payload.layout.edges);
                syncCanvasNodeIndexes(state);
                state.layoutDirty = false;
                state.saveStatusVisible = false;
                state.selectionViaBox = false;
                state.pendingDeleteAssetIds = [];
                state.history = createEmptyCanvasHistory();
            })
            .addCase(loadCanvasAssets.rejected, (state, action) => {
                state.assetsLoading = false;

                if (action.meta.aborted || action.payload === "aborted") {
                    return;
                }

                state.errorMessage = String(action.payload ?? "加载资产失败");
            })
            .addCase(loadCanvasSeries.pending, (state) => {
                state.seriesLoading = true;
            })
            .addCase(loadCanvasSeries.fulfilled, (state, action) => {
                state.seriesLoading = false;
                state.seriesLoaded = true;
                state.series = action.payload;
            })
            .addCase(loadCanvasSeries.rejected, (state, action) => {
                state.seriesLoading = false;

                if (action.meta.aborted || action.payload === "aborted") {
                    return;
                }
            })
            .addCase(createCanvasAsset.pending, (state) => {
                state.assetCreating = true;
                state.errorMessage = "";
            })
            .addCase(createCanvasAsset.fulfilled, (state, action) => {
                state.assetCreating = false;
                upsertCanvasAsset(state, action.payload.asset);
                state.nodes = appendCanvasNode(
                    state.nodes,
                    action.payload.asset,
                    action.payload.position,
                );
                syncCanvasNodeIndexes(state);
                state.layoutDirty = true;
            })
            .addCase(createCanvasAsset.rejected, (state, action) => {
                state.assetCreating = false;
                state.errorMessage = String(action.payload ?? "创建资产失败");
            })
            .addCase(createReferencedCanvasAsset.pending, (state) => {
                state.assetCreating = true;
                state.errorMessage = "";
            })
            .addCase(createReferencedCanvasAsset.fulfilled, (state, action) => {
                state.assetCreating = false;
                upsertCanvasAsset(state, action.payload.sourceAsset);
                upsertCanvasAsset(state, action.payload.asset);
                const next = appendReferencedCanvasNode(
                    state.nodes,
                    state.edges,
                    action.payload.asset,
                    action.payload.sourceNodeId,
                );
                state.nodes = next.nodes;
                state.edges = next.edges;
                syncCanvasNodeIndexes(state);
                state.layoutDirty = true;
            })
            .addCase(createReferencedCanvasAsset.rejected, (state, action) => {
                state.assetCreating = false;
                state.errorMessage = String(action.payload ?? "创建引用节点失败");
            })
            .addCase(clearCanvasAssetReference.fulfilled, (state, action) => {
                upsertCanvasAsset(state, action.payload.asset);
            })
            .addCase(clearCanvasAssetReference.rejected, (state, action) => {
                state.errorMessage = String(action.payload ?? "清除引用失败");
            })
            .addCase(createContextCanvasAsset.pending, (state) => {
                state.assetCreating = true;
                state.errorMessage = "";
            })
            .addCase(createContextCanvasAsset.fulfilled, (state, action) => {
                state.assetCreating = false;
                upsertCanvasAsset(state, action.payload.asset);
                const next = appendContextCanvasNode(
                    state.nodes,
                    state.edges,
                    action.payload.asset,
                    action.payload.targetNodeId,
                );
                state.nodes = next.nodes;
                state.edges = next.edges;
                syncCanvasNodeIndexes(state);
                state.layoutDirty = true;
            })
            .addCase(createContextCanvasAsset.rejected, (state, action) => {
                state.assetCreating = false;
                state.errorMessage = String(action.payload ?? "添加上下文失败");
            })
            .addCase(deleteCanvasAssets.pending, (state) => {
                state.assetDeleting = true;
                state.errorMessage = "";
            })
            .addCase(deleteCanvasAssets.fulfilled, (state, action) => {
                state.assetDeleting = false;
                const assetIdSet = new Set(action.payload);
                removeCanvasAssetsByIds(state, action.payload);
                state.pendingDeleteAssetIds = state.pendingDeleteAssetIds.filter(
                    (id) => !assetIdSet.has(id),
                );
                const next = removeCanvasNodesByAssetIds(state.nodes, state.edges, action.payload);
                state.nodes = next.nodes;
                state.edges = next.edges;
                syncCanvasNodeIndexes(state);
            })
            .addCase(deleteCanvasAssets.rejected, (state, action) => {
                state.assetDeleting = false;
                state.errorMessage = String(action.payload ?? "删除资产失败");
            })
            .addCase(saveCanvasLayout.pending, (state) => {
                state.canvasSaving = true;
            })
            .addCase(saveCanvasLayout.fulfilled, (state, action) => {
                state.canvasSaving = false;
                const currentLayout = serializeCanvasLayout(state.nodes, state.edges);
                const isSameLayout = isSameCanvasLayout(currentLayout, action.payload);

                if (isSameLayout) {
                    state.layoutDirty = false;
                    state.saveStatusVisible = true;
                }
            })
            .addCase(saveCanvasLayout.rejected, (state, action) => {
                state.canvasSaving = false;
                state.errorMessage = String(action.payload ?? "保存画布失败");
            })
            .addCase(generateCanvasImage.pending, (state, action) => {
                state.generatingAssetId = action.meta.arg.assetId;
                state.errorMessage = "";
            })
            .addCase(generateCanvasImage.fulfilled, (state, action) => {
                state.generatingAssetId = null;
                applyAssetMediaUpdateToState(state, {
                    assetId: action.payload.assetId,
                    asset: action.payload.asset,
                });
            })
            .addCase(generateCanvasImage.rejected, (state, action) => {
                state.generatingAssetId = null;
                state.errorMessage = String(action.payload ?? "图片生成失败");
            })
            .addCase(submitCanvasAudioPrompt.fulfilled, (state, action) => {
                upsertCanvasAsset(state, action.payload.asset);
                state.saveStatusVisible = true;
                state.errorMessage = "";
            })
            .addCase(submitCanvasAudioPrompt.rejected, (state, action) => {
                state.errorMessage = String(action.payload ?? "保存失败");
            })
            .addCase(saveCanvasAudioReferenceFiles.fulfilled, (state, action) => {
                upsertCanvasAsset(state, action.payload.asset);
                state.saveStatusVisible = true;
                state.errorMessage = "";
            })
            .addCase(saveCanvasAudioReferenceFiles.rejected, (state, action) => {
                state.errorMessage = String(action.payload ?? "保存失败");
            })
            .addCase(uploadCanvasAudioMedia.fulfilled, (state, action) => {
                applyAssetMediaUpdateToState(state, action.payload);
            })
            .addCase(uploadCanvasAudioMedia.rejected, (state, action) => {
                state.errorMessage = String(action.payload ?? "音频上传失败");
            })
            .addCase(uploadCanvasImageMedia.fulfilled, (state, action) => {
                applyAssetMediaUpdateToState(state, action.payload);
            })
            .addCase(uploadCanvasImageMedia.rejected, (state, action) => {
                state.errorMessage = String(action.payload ?? "图片上传失败");
            })
            .addCase(applyCanvasLibraryMedia.fulfilled, (state, action) => {
                applyAssetMediaUpdateToState(state, action.payload);
            })
            .addCase(applyCanvasLibraryMedia.rejected, (state, action) => {
                state.errorMessage = String(action.payload ?? "应用资产失败");
            })
            .addCase(markCanvasAssetAsMaterial.fulfilled, (state, action) => {
                upsertCanvasAsset(state, action.payload.asset);
                state.saveStatusVisible = true;
                state.errorMessage = "";
            })
            .addCase(markCanvasAssetAsMaterial.rejected, (state, action) => {
                state.errorMessage = String(action.payload ?? "保存到素材库失败");
            })
            .addCase(bindAudioToCharacters.fulfilled, (state, action) => {
                mergeCanvasAssets(state, action.payload.savedAssets);
                state.saveStatusVisible = true;
                state.errorMessage = "";
            })
            .addCase(bindAudioToCharacters.rejected, (state, action) => {
                state.errorMessage = String(action.payload ?? "绑定角色失败");
            })
            .addCase(unbindCharacterVoiceAudio.fulfilled, (state, action) => {
                mergeCanvasAssets(state, action.payload.savedAssets);
                state.saveStatusVisible = true;
                state.errorMessage = "";
            })
            .addCase(unbindCharacterVoiceAudio.rejected, (state, action) => {
                state.errorMessage = String(action.payload ?? "解除绑定失败");
            })
            .addCase(updateCharacterAssetProfile.fulfilled, (state, action) => {
                applyCharacterProfileUpdatesToState(state, action.payload.savedAssets);
            })
            .addCase(updateCharacterAssetProfile.rejected, (state, action) => {
                state.errorMessage = String(action.payload ?? "资料更新失败");
            });
    },
});

export const {
    resetCanvas,
    nodesChanged,
    commitNodePositions,
    edgesChanged,
    edgeConnected,
    hideSaveStatus,
    setSnapToGrid,
    setShowMinimap,
    toggleSnapToGrid,
    toggleMinimap,
    focusCanvasAsset,
    updateCanvasNodeTextContent,
    setSelectionViaBox,
    pushCanvasHistorySnapshot,
    stageCanvasNodesRemoval,
    undoCanvas,
    redoCanvas,
    openMediaImagePreview,
    closeMediaImagePreview,
} = canvasSlice.actions;
export const canvasReducer = canvasSlice.reducer;

// 重新导出 thunks 与 selectors，保持既有 "@/store/canvasSlice" 引用兼容
export * from "@/store/canvasThunks";
export * from "@/store/canvasSelectors";
