// 画布 Redux 状态类型
import type { ProjectAsset } from "@/api/asset";
import type { ProjectSerie } from "@/api/serie";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import type { Edge, Node } from "@xyflow/react";
import type { CanvasHistoryState } from "@/lib/canvasHistory";
import type {
    CanvasLayoutEdge,
    CanvasPosition,
    SaveAssetParamsItem,
} from "@/types/assetParams";

// 资产 params 相关类型统一由 types/assetParams 维护，此处 re-export 便于画布模块引用
export type {
    AssetParams,
    AudioCharacterBindingMode,
    CanvasAssetParams,
    CanvasAudioCharacterBinding,
    CanvasAudioGenerationSettings,
    CanvasAudioReferenceFile,
    CanvasGenerationSettings,
    CanvasLayoutEdge,
    CanvasPosition,
    CanvasVoiceAudioBinding,
    SaveAssetParamsItem,
} from "@/types/assetParams";

// CanvasAssetNodeData 画布资产节点数据
export type CanvasAssetNodeData = {
    assetId: number;
    kind: CanvasNodeKind;
    label: string;
    characterName?: string;
    textContent?: string;
    mediaUrl?: string | null;
};

// SaveCanvasAssetItem 保存画布时的单条资产更新（兼容旧名）
export type SaveCanvasAssetItem = SaveAssetParamsItem;

// CanvasLayoutPayload 画布布局数据结构（前端解析用）
export type CanvasLayoutPayload = {
    nodes: Array<{
        assetId: number;
        position: CanvasPosition;
    }>;
    edges: CanvasLayoutEdge[];
};

// CanvasMediaImagePreviewState 画布全局图片预览状态
export type CanvasMediaImagePreviewState = {
    src: string;
    alt: string;
} | null;

// CanvasState 画布模块状态
export type CanvasState = {
    projectId: number | null;
    assetsById: Record<number, ProjectAsset>;
    assetIds: number[];
    series: ProjectSerie[];
    seriesLoading: boolean;
    seriesLoaded: boolean;
    nodes: Node<CanvasAssetNodeData>[];
    edges: Edge[];
    nodeIdSet: Record<string, true>;
    nodeIndexByAssetId: Record<number, number>;
    assetsLoading: boolean;
    assetCreating: boolean;
    assetDeleting: boolean;
    canvasSaving: boolean;
    layoutDirty: boolean;
    saveStatusVisible: boolean;
    errorMessage: string;
    snapToGrid: boolean;
    showMinimap: boolean;
    selectionViaBox: boolean;
    pendingDeleteAssetIds: number[];
    generatingAssetId: number | null;
    mediaImagePreview: CanvasMediaImagePreviewState;
    history: CanvasHistoryState;
};
