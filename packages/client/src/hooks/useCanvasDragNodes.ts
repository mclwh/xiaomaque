// 拖拽期间本地缓冲节点位置，松手后再同步 Redux
import { useCallback, useState } from "react";
import { applyNodeChanges, type Node, type NodeChange } from "@xyflow/react";
import {
    commitNodePositions,
    nodesChanged,
    pushCanvasHistorySnapshot,
} from "@/store/canvasSlice";
import type { CanvasAssetNodeData } from "@/store/types/canvas";
import { isDraggingOnlyChanges, partitionNodeChanges } from "@/lib/canvasNodeChanges";
import type { AppDispatch } from "@/store";

type UseCanvasDragNodesOptions = {
    reduxNodes: Node<CanvasAssetNodeData>[];
    dispatch: AppDispatch;
};

type UseCanvasDragNodesResult = {
    displayNodes: Node<CanvasAssetNodeData>[];
    onNodesChange: (changes: NodeChange[]) => void;
    onNodeDragStart: () => void;
    clearDragOverlay: () => void;
};

// 管理拖拽本地 overlay 与 Redux 提交的节点变更
export function useCanvasDragNodes({
    reduxNodes,
    dispatch,
}: UseCanvasDragNodesOptions): UseCanvasDragNodesResult {
    // dragOverlay 拖拽进行中的本地节点镜像
    const [dragOverlay, setDragOverlay] = useState<Node<CanvasAssetNodeData>[] | null>(null);

    const displayNodes = dragOverlay ?? reduxNodes;

    // 拖拽开始时压入撤销快照
    const onNodeDragStart = useCallback(() => {
        dispatch(pushCanvasHistorySnapshot());
    }, [dispatch]);

    // 清空本地拖拽 overlay
    const clearDragOverlay = useCallback(() => {
        setDragOverlay(null);
    }, []);

    // 分流节点变更：拖拽中走本地，其余走 Redux
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
            if (changes.length === 0) {
                return;
            }

            if (isDraggingOnlyChanges(changes)) {
                setDragOverlay(
                    applyNodeChanges(changes, dragOverlay ?? reduxNodes) as Node<CanvasAssetNodeData>[],
                );
                return;
            }

            const { dragEndPosition, other } = partitionNodeChanges(changes);
            const reduxChanges = [...dragEndPosition, ...other];

            if (reduxChanges.length > 0) {
                if (dragEndPosition.length > 0) {
                    dispatch(commitNodePositions(reduxChanges));
                } else {
                    dispatch(nodesChanged(reduxChanges));
                }
            }

            setDragOverlay(null);
        },
        [dispatch, dragOverlay, reduxNodes],
    );

    return {
        displayNodes,
        onNodesChange,
        onNodeDragStart,
        clearDragOverlay,
    };
}
