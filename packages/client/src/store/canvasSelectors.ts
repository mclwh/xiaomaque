// 画布状态选择器：从归一化状态派生列表、单项与各类布尔标记
import { createSelector } from "@reduxjs/toolkit";
import { filterBindableAudioAssets } from "@/lib/canvasNodeMedia";
import type { CanvasState } from "@/store/types/canvas";

// 是否展示默认节点选择器
export function selectShowNodeSelector(state: { canvas: CanvasState }) {
    return !state.canvas.assetsLoading && state.canvas.assetIds.length === 0;
}

// 画布资产列表（由归一化索引还原）
export const selectCanvasAssetsList = createSelector(
    [(state: { canvas: CanvasState }) => state.canvas.assetIds, (state: { canvas: CanvasState }) => state.canvas.assetsById],
    (assetIds, assetsById) => assetIds.map((id) => assetsById[id]).filter(Boolean),
);

// 指定 ID 的画布资产
export const selectCanvasAssetById = createSelector(
    [
        (state: { canvas: CanvasState }) => state.canvas.assetsById,
        (_state: { canvas: CanvasState }, assetId: number) => assetId,
    ],
    (assetsById, assetId) => assetsById[assetId] ?? null,
);

// 画布项目集数列表
export const selectCanvasSeries = (state: { canvas: CanvasState }) => state.canvas.series;
export const selectCanvasSeriesLoading = (state: { canvas: CanvasState }) =>
    state.canvas.seriesLoading;
export const selectCanvasSeriesLoaded = (state: { canvas: CanvasState }) =>
    state.canvas.seriesLoaded;
export const selectCanvasProjectId = (state: { canvas: CanvasState }) => state.canvas.projectId;

// 画布中可绑定到角色的音频资产列表
export const selectBindableAudioAssets = createSelector(
    [selectCanvasAssetsList],
    (assets) => filterBindableAudioAssets(assets),
);

// 画布是否正在创建资产
export function selectAssetCreating(state: { canvas: CanvasState }) {
    return state.canvas.assetCreating;
}

// 是否展示节点编辑面板（框选时不展示）
export function selectShowNodeEditorPanel(state: { canvas: CanvasState }) {
    return !state.canvas.selectionViaBox;
}

// 是否可撤销
export function selectCanUndo(state: { canvas: CanvasState }) {
    return state.canvas.history.past.length > 0;
}

// 是否可重做
export function selectCanRedo(state: { canvas: CanvasState }) {
    return state.canvas.history.future.length > 0;
}

// 当前是否正在生成图片
export function selectCanvasImageGenerating(state: { canvas: CanvasState }) {
    return state.canvas.generatingAssetId !== null;
}

// 指定资产是否正在生成图片
export function selectIsAssetGenerating(assetId: number) {
    return (state: { canvas: CanvasState }) => state.canvas.generatingAssetId === assetId;
}

// 指定节点 ID 是否存在于画布
export function selectCanvasNodeExists(nodeId: string) {
    return (state: { canvas: CanvasState }) => Boolean(state.canvas.nodeIdSet[nodeId]);
}

// 获取画布全局图片预览状态
export function selectMediaImagePreview(state: { canvas: CanvasState }) {
    return state.canvas.mediaImagePreview;
}
