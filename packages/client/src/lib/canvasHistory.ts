// 画布撤销/重做历史栈纯函数
import type { ProjectAsset } from "@/api/asset";
import type { Edge, Node } from "@xyflow/react";
import type { CanvasAssetNodeData } from "@/store/types/canvas";

// MAX_CANVAS_HISTORY 历史栈最大深度
export const MAX_CANVAS_HISTORY = 100;

// CanvasSnapshot 画布节点、连线、资产与待删除 ID 的快照
export type CanvasSnapshot = {
    nodes: Node<CanvasAssetNodeData>[];
    edges: Edge[];
    assets: ProjectAsset[];
    pendingDeleteAssetIds: number[];
};

// CanvasHistoryState 撤销/重做栈
export type CanvasHistoryState = {
    past: CanvasSnapshot[];
    future: CanvasSnapshot[];
};

// createEmptyCanvasHistory 创建空历史栈
export function createEmptyCanvasHistory(): CanvasHistoryState {
    return { past: [], future: [] };
}

// cloneCanvasSnapshot 深拷贝画布快照
export function cloneCanvasSnapshot(snapshot: CanvasSnapshot): CanvasSnapshot {
    return JSON.parse(JSON.stringify(snapshot)) as CanvasSnapshot;
}

// pushHistory 将快照压入 past 并清空 future
export function pushHistory(
    history: CanvasHistoryState,
    snapshot: CanvasSnapshot,
): CanvasHistoryState {
    /*
     * nextPast 追加后的 past 栈
     * trimmedPast 超出上限后截断的 past 栈
     */
    const nextPast = [...history.past, cloneCanvasSnapshot(snapshot)];
    const trimmedPast =
        nextPast.length > MAX_CANVAS_HISTORY
            ? nextPast.slice(nextPast.length - MAX_CANVAS_HISTORY)
            : nextPast;

    return {
        past: trimmedPast,
        future: [],
    };
}

// undoHistory 从 past 弹出上一快照并恢复
export function undoHistory(
    current: CanvasSnapshot,
    history: CanvasHistoryState,
): { snapshot: CanvasSnapshot; history: CanvasHistoryState } | null {
    if (history.past.length === 0) {
        return null;
    }

    /*
     * previous 即将恢复的快照
     * remainingPast 弹出后的 past 栈
     */
    const remainingPast = [...history.past];
    const previous = remainingPast.pop()!;

    return {
        snapshot: cloneCanvasSnapshot(previous),
        history: {
            past: remainingPast,
            future: [cloneCanvasSnapshot(current), ...history.future],
        },
    };
}

// redoHistory 从 future 弹出下一快照并恢复
export function redoHistory(
    current: CanvasSnapshot,
    history: CanvasHistoryState,
): { snapshot: CanvasSnapshot; history: CanvasHistoryState } | null {
    if (history.future.length === 0) {
        return null;
    }

    /*
     * next 即将恢复的快照
     * remainingFuture 弹出后的 future 栈
     */
    const remainingFuture = [...history.future];
    const next = remainingFuture.shift()!;

    return {
        snapshot: cloneCanvasSnapshot(next),
        history: {
            past: [...history.past, cloneCanvasSnapshot(current)],
            future: remainingFuture,
        },
    };
}

// canUndo 是否可撤销
export function canUndo(history: CanvasHistoryState): boolean {
    return history.past.length > 0;
}

// canRedo 是否可重做
export function canRedo(history: CanvasHistoryState): boolean {
    return history.future.length > 0;
}
