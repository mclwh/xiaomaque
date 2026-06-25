// 画布测试状态构造辅助
import type { ProjectAsset } from "@/api/asset";
import { buildAssetsIndex } from "@/lib/canvasAssetsIndex";
import { createEmptyCanvasHistory } from "@/lib/canvasHistory";
import { buildCanvasNodeIndexes } from "@/lib/canvasNodeIndex";
import { createEmptyEdges } from "@/lib/canvasNodes";
import type { CanvasState } from "@/store/types/canvas";
import type { Node } from "@xyflow/react";
import type { CanvasAssetNodeData } from "@/store/types/canvas";

// createTestCanvasState 由 assets 与 nodes 构造完整 CanvasState
export function createTestCanvasState(
    overrides: Partial<CanvasState> & {
        assets?: ProjectAsset[];
        nodes?: Node<CanvasAssetNodeData>[];
    } = {},
): CanvasState {
    const { assets: assetList = [], nodes = [], ...rest } = overrides;
    const assetIndex = buildAssetsIndex(assetList);
    const nodeIndexes = buildCanvasNodeIndexes(nodes);

    return {
        projectId: 1,
        assetsById: assetIndex.assetsById,
        assetIds: assetIndex.assetIds,
        series: [],
        seriesLoading: false,
        seriesLoaded: false,
        nodes,
        edges: createEmptyEdges(),
        nodeIdSet: nodeIndexes.nodeIdSet,
        nodeIndexByAssetId: nodeIndexes.nodeIndexByAssetId,
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
        ...rest,
    };
}

// getCanvasAssetsFromState 从状态读取资产列表
export function getCanvasAssetsFromState(state: CanvasState): ProjectAsset[] {
    return state.assetIds.map((id) => state.assetsById[id]).filter(Boolean);
}
