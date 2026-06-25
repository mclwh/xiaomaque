// 画布节点 id 与 assetId 索引维护
import type { Node } from "@xyflow/react";
import type { CanvasAssetNodeData } from "@/store/types/canvas";

// CanvasNodeIndexes nodeId 存在集与 assetId → 数组下标
export type CanvasNodeIndexes = {
    nodeIdSet: Record<string, true>;
    nodeIndexByAssetId: Record<number, number>;
};

// 由节点列表构建索引
export function buildCanvasNodeIndexes(
    nodes: Node<CanvasAssetNodeData>[],
): CanvasNodeIndexes {
    /*
     * nodeIdSet 节点 id 存在标记
     * nodeIndexByAssetId 资产 id → nodes 数组下标
     */
    const nodeIdSet: Record<string, true> = {};
    const nodeIndexByAssetId: Record<number, number> = {};

    nodes.forEach((node, index) => {
        nodeIdSet[node.id] = true;
        nodeIndexByAssetId[node.data.assetId] = index;
    });

    return { nodeIdSet, nodeIndexByAssetId };
}

// 创建空索引
export function createEmptyCanvasNodeIndexes(): CanvasNodeIndexes {
    return { nodeIdSet: {}, nodeIndexByAssetId: {} };
}

// 判断节点 id 是否存在
export function hasCanvasNodeId(indexes: CanvasNodeIndexes, nodeId: string): boolean {
    return Boolean(indexes.nodeIdSet[nodeId]);
}
