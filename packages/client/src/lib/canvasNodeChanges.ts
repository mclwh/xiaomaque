// React Flow 节点变更分类与布局判定
import type { NodeChange } from "@xyflow/react";

// PartitionedNodeChanges 按交互阶段分区后的节点变更
export type PartitionedNodeChanges = {
    draggingPosition: NodeChange[];
    dragEndPosition: NodeChange[];
    other: NodeChange[];
};

// isDraggingPositionChange 是否为拖拽中的位置变更
function isDraggingPositionChange(change: NodeChange): boolean {
    return change.type === "position" && change.dragging === true;
}

// isDragEndPositionChange 是否为拖拽结束的位置变更
function isDragEndPositionChange(change: NodeChange): boolean {
    return change.type === "position" && change.dragging === false;
}

// partitionNodeChanges 将节点变更按拖拽阶段分区
export function partitionNodeChanges(changes: NodeChange[]): PartitionedNodeChanges {
    /*
     * draggingPosition 拖拽进行中的位置变更
     * dragEndPosition 拖拽结束的位置变更
     * other 选中、尺寸等非拖拽位置变更
     */
    const draggingPosition: NodeChange[] = [];
    const dragEndPosition: NodeChange[] = [];
    const other: NodeChange[] = [];

    for (const change of changes) {
        if (isDraggingPositionChange(change)) {
            draggingPosition.push(change);
            continue;
        }

        if (isDragEndPositionChange(change)) {
            dragEndPosition.push(change);
            continue;
        }

        other.push(change);
    }

    return { draggingPosition, dragEndPosition, other };
}

// shouldDeferToRedux 是否应将变更立即同步到 Redux
export function shouldDeferToRedux(changes: NodeChange[]): boolean {
    if (changes.length === 0) {
        return false;
    }

    const { draggingPosition, dragEndPosition, other } = partitionNodeChanges(changes);

    if (draggingPosition.length > 0) {
        return false;
    }

    return dragEndPosition.length > 0 || other.length > 0;
}

// hasLayoutNodeChange 判断节点变更是否影响布局（需触发保存）
export function hasLayoutNodeChange(changes: NodeChange[]): boolean {
    return changes.some((change) => {
        if (change.type === "position") {
            return change.dragging === false;
        }

        return change.type === "dimensions" || change.type === "replace";
    });
}

// isDraggingOnlyChanges 是否仅包含拖拽中的位置变更
export function isDraggingOnlyChanges(changes: NodeChange[]): boolean {
    const { draggingPosition, dragEndPosition, other } = partitionNodeChanges(changes);

    return (
        draggingPosition.length > 0 && dragEndPosition.length === 0 && other.length === 0
    );
}
