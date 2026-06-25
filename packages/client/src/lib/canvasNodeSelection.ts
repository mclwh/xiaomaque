// 画布节点选中态局部 patch：避免全量 map 产生新引用
import type { Node } from "@xyflow/react";

// 仅修改 selected 发生变化的节点，其余保持原引用
export function patchNodeSelection<T extends Node>(
    nodes: T[],
    targetSelectedIds: Set<string>,
): T[] {
    let changed = false;
    const next = nodes.map((node) => {
        const shouldSelect = targetSelectedIds.has(node.id);

        if (Boolean(node.selected) === shouldSelect) {
            return node;
        }

        changed = true;
        return { ...node, selected: shouldSelect };
    });

    return changed ? next : nodes;
}

// 取消已有选中并追加新节点（新建节点场景）
export function clearSelectionAndAppendNode<T extends Node>(nodes: T[], newNode: T): T[] {
    const next: T[] = [];
    let changed = false;

    for (const node of nodes) {
        if (node.selected) {
            next.push({ ...node, selected: false });
            changed = true;
        } else {
            next.push(node);
        }
    }

    next.push(newNode);

    if (!changed) {
        return [...nodes, newNode];
    }

    return next;
}

// 聚焦单个节点选中态
export function focusNodeSelection<T extends Node>(nodes: T[], targetNodeId: string): T[] {
    return patchNodeSelection(nodes, new Set([targetNodeId]));
}
