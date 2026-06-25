import { addEdge, type Edge, type Node } from "@xyflow/react";
import type { ProjectAsset } from "@/api/asset";
import { getCanvasNodeDimensions, CANVAS_NODE_UI } from "@/components/canvas/canvasNodeConfig";
import { resolveCanvasNodeKind } from "@/lib/assetCategory";
import { readAssetAppearanceName, readAssetEntityName, readAssetCanvasParams, mergeAssetParams } from "@/lib/assetParams";
import { buildCanvasFlowEdge } from "@/lib/canvasEdges";
import { clearSelectionAndAppendNode } from "@/lib/canvasNodeSelection";
import type {
    CanvasAssetNodeData,
    CanvasLayoutPayload,
} from "@/store/types/canvas";
import type { CanvasAssetParams, SaveAssetParamsItem } from "@/types/assetParams";

// 根据资产 ID 生成 React Flow 节点 ID
export function getCanvasNodeId(assetId: number) {
    return `asset-${assetId}`;
}

// 从 React Flow 节点 ID 解析资产 ID
export function parseCanvasNodeId(nodeId: string): number | null {
    const matched = /^asset-(\d+)$/.exec(nodeId);

    if (!matched) {
        return null;
    }

    return Number(matched[1]);
}

// 为节点写入预设 width/height，便于视口裁剪
export function applyCanvasNodeDimensions<T extends Node<CanvasAssetNodeData>>(node: T): T {
    const dimensions = getCanvasNodeDimensions(node.data.kind);

    return {
        ...node,
        width: node.width ?? dimensions.width,
        height: node.height ?? dimensions.height,
    };
}

// 构建画布节点 data 字段
export function buildCanvasAssetNodeData(asset: ProjectAsset): CanvasAssetNodeData {
    const kind = resolveCanvasNodeKind(asset);
    const entityName = readAssetEntityName(asset);
    const appearanceName = readAssetAppearanceName(asset);

    return {
        assetId: asset.id,
        kind,
        label:
            kind === "character"
                ? (appearanceName ?? CANVAS_NODE_UI.character.footerTitle)
                : (entityName ?? asset.name ?? "未命名"),
        mediaUrl: asset.url,
        ...(kind === "character" && entityName ? { characterName: entityName } : {}),
        ...(kind === "text"
            ? { textContent: readAssetCanvasParams(asset.params)?.textContent ?? "" }
            : {}),
    };
}

// 从资产列表解析画布布局（节点位置与连线）
export function parseCanvasLayoutFromAssets(assets: ProjectAsset[]): CanvasLayoutPayload {
    const nodes = assets.map((asset, index) => {
        const canvas = readAssetCanvasParams(asset.params);
        const position = canvas?.position;

        return {
            assetId: asset.id,
            position: position ?? {
                x: index * 240,
                y: 0,
            },
        };
    });

    const edgesSource = assets.find((asset) => {
        const canvas = readAssetCanvasParams(asset.params);
        return Array.isArray(canvas?.edges) && canvas.edges.length > 0;
    });
    const edges = edgesSource ? (readAssetCanvasParams(edgesSource.params)?.edges ?? []) : [];

    return { nodes, edges };
}

// 将画布节点与连线序列化为资产 params 更新项
export function serializeCanvasToAssetUpdates(
    nodes: Node<CanvasAssetNodeData>[],
    edges: Edge[],
    assets: ProjectAsset[],
): SaveAssetParamsItem[] {
    if (nodes.length === 0) {
        return [];
    }

    const assetById = new Map(assets.map((asset) => [asset.id, asset]));
    const serializedEdges = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? null,
        targetHandle: edge.targetHandle ?? null,
    }));
    const anchorAssetId = Math.min(...nodes.map((node) => node.data.assetId));

    return nodes.map((node) => {
        const asset = assetById.get(node.data.assetId);
        const existingCanvas = readAssetCanvasParams(asset?.params) ?? {};
        const canvas: CanvasAssetParams = {
            ...existingCanvas,
            position: {
                x: node.position.x,
                y: node.position.y,
            },
        };

        if (node.data.assetId === anchorAssetId) {
            canvas.edges = serializedEdges;
        } else {
            delete canvas.edges;
        }

        if (node.data.kind === "text") {
            canvas.textContent = node.data.textContent ?? "";
        }

        return {
            asset_id: node.data.assetId,
            params: mergeAssetParams(asset?.params, canvas),
        };
    });
}

// 将资产列表转换为 React Flow 节点
export function buildCanvasNodes(assets: ProjectAsset[]): Node<CanvasAssetNodeData>[] {
    const layout = parseCanvasLayoutFromAssets(assets);

    return assets.map((asset, index) =>
        applyCanvasNodeDimensions({
            id: getCanvasNodeId(asset.id),
            type: "canvasAsset",
            position: layout.nodes[index]?.position ?? {
                x: index * 240,
                y: 0,
            },
            data: buildCanvasAssetNodeData(asset),
        }),
    );
}

// 将画布节点与连线序列化为可持久化结构（用于保存前后对比）
export function serializeCanvasLayout(
    nodes: Node<CanvasAssetNodeData>[],
    edges: Edge[],
): CanvasLayoutPayload {
    return {
        nodes: nodes.map((node) => ({
            assetId: node.data.assetId,
            position: {
                x: node.position.x,
                y: node.position.y,
            },
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,
        })),
    };
}

/**
 * 结构化比较两份画布布局是否一致
 * 逐项比较节点位置与连线端点，避免对大画布做双向 JSON.stringify 序列化对比
 * @param a 布局 A
 * @param b 布局 B
 * @returns 两份布局完全一致返回 true
 */
export function isSameCanvasLayout(a: CanvasLayoutPayload, b: CanvasLayoutPayload): boolean {
    if (a.nodes.length !== b.nodes.length || a.edges.length !== b.edges.length) {
        return false;
    }

    for (let i = 0; i < a.nodes.length; i++) {
        const nodeA = a.nodes[i];
        const nodeB = b.nodes[i];

        if (
            nodeA.assetId !== nodeB.assetId ||
            nodeA.position.x !== nodeB.position.x ||
            nodeA.position.y !== nodeB.position.y
        ) {
            return false;
        }
    }

    for (let i = 0; i < a.edges.length; i++) {
        const edgeA = a.edges[i];
        const edgeB = b.edges[i];

        if (
            edgeA.id !== edgeB.id ||
            edgeA.source !== edgeB.source ||
            edgeA.target !== edgeB.target ||
            edgeA.sourceHandle !== edgeB.sourceHandle ||
            edgeA.targetHandle !== edgeB.targetHandle
        ) {
            return false;
        }
    }

    return true;
}

// 恢复已保存的连线列表
export function restoreCanvasEdges(savedEdges: CanvasLayoutPayload["edges"] = []): Edge[] {
    return savedEdges.map((edge) =>
        buildCanvasFlowEdge({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle ?? undefined,
            targetHandle: edge.targetHandle ?? undefined,
        }),
    );
}

// REFERENCE_NODE_GAP 引用生成的新节点与源节点水平间距
const REFERENCE_NODE_GAP = 48;

// CONTEXT_TARGET_HANDLE 上下文节点连线的目标 Handle ID
const CONTEXT_TARGET_HANDLE = "context-target";

// REFERENCE_SOURCE_HANDLE 引用节点连线的源 Handle ID
const REFERENCE_SOURCE_HANDLE = "reference-source";

// 根据目标节点在左侧追加上下文节点并自动连线
export function appendContextCanvasNode(
    nodes: Node<CanvasAssetNodeData>[],
    edges: Edge[],
    asset: ProjectAsset,
    targetNodeId: string,
) {
    const targetNode = nodes.find((node) => node.id === targetNodeId);
    const contextKind = resolveCanvasNodeKind(asset);
    const contextWidth = CANVAS_NODE_UI[contextKind].cardWidth;
    const newNodeId = getCanvasNodeId(asset.id);
    const fallbackPosition = {
        x: nodes.length * 240,
        y: 0,
    };
    const position = targetNode
        ? {
              x: targetNode.position.x - contextWidth - REFERENCE_NODE_GAP,
              y: targetNode.position.y,
          }
        : fallbackPosition;
    const newNode = applyCanvasNodeDimensions({
        id: newNodeId,
        type: "canvasAsset",
        position,
        selected: true,
        data: buildCanvasAssetNodeData(asset),
    });
    const nextNodes = clearSelectionAndAppendNode(nodes, newNode);
    const nextEdges = targetNode
        ? addEdge(
              buildCanvasFlowEdge({
                  id: `edge-${newNodeId}-${targetNodeId}`,
                  source: newNodeId,
                  target: targetNodeId,
                  targetHandle: CONTEXT_TARGET_HANDLE,
              }),
              edges,
          )
        : edges;

    return {
        nodes: nextNodes,
        edges: nextEdges,
    };
}

// 根据引用源节点追加画布节点并自动连线
export function appendReferencedCanvasNode(
    nodes: Node<CanvasAssetNodeData>[],
    edges: Edge[],
    asset: ProjectAsset,
    sourceNodeId: string,
) {
    const sourceNode = nodes.find((node) => node.id === sourceNodeId);
    const sourceKind = sourceNode?.data.kind ?? "character";
    const sourceWidth = CANVAS_NODE_UI[sourceKind].cardWidth;
    const newNodeId = getCanvasNodeId(asset.id);
    const fallbackPosition = {
        x: nodes.length * 240,
        y: 0,
    };
    const position = sourceNode
        ? {
              x: sourceNode.position.x + sourceWidth + REFERENCE_NODE_GAP,
              y: sourceNode.position.y,
          }
        : fallbackPosition;
    const newNode = applyCanvasNodeDimensions({
        id: newNodeId,
        type: "canvasAsset",
        position,
        selected: true,
        data: buildCanvasAssetNodeData(asset),
    });
    const nextNodes = clearSelectionAndAppendNode(nodes, newNode);
    const nextEdges = sourceNode
        ? addEdge(
              buildCanvasFlowEdge({
                  id: `edge-${sourceNodeId}-${newNodeId}`,
                  source: sourceNodeId,
                  target: newNodeId,
                  sourceHandle: REFERENCE_SOURCE_HANDLE,
              }),
              edges,
          )
        : edges;

    return {
        nodes: nextNodes,
        edges: nextEdges,
    };
}

// 根据新建资产追加画布节点，可选指定位置（默认按序号横向排布）
export function appendCanvasNode(
    nodes: Node<CanvasAssetNodeData>[],
    asset: ProjectAsset,
    position?: { x: number; y: number },
): Node<CanvasAssetNodeData>[] {
    const newNodeId = getCanvasNodeId(asset.id);
    const fallbackPosition = {
        x: nodes.length * 240,
        y: 0,
    };
    const newNode = applyCanvasNodeDimensions({
        id: newNodeId,
        type: "canvasAsset",
        position: position ?? fallbackPosition,
        selected: true,
        data: buildCanvasAssetNodeData(asset),
    });

    return clearSelectionAndAppendNode(nodes, newNode);
}

// 默认空边集合
export function createEmptyEdges(): Edge[] {
    return [];
}

// 根据资产 ID 移除节点，并清理关联连线
export function removeCanvasNodesByAssetIds(
    nodes: Node<CanvasAssetNodeData>[],
    edges: Edge[],
    assetIds: number[],
) {
    const assetIdSet = new Set(assetIds);
    const removedNodeIds = new Set(
        nodes.filter((node) => assetIdSet.has(node.data.assetId)).map((node) => node.id),
    );

    return {
        nodes: nodes.filter((node) => !assetIdSet.has(node.data.assetId)),
        edges: edges.filter(
            (edge) => !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target),
        ),
    };
}

// 从节点变更中提取待删除的资产 ID
export function collectRemovedAssetIds(
    nodes: Node<CanvasAssetNodeData>[],
    changes: Array<{ type: string; id: string }>,
) {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const assetIds: number[] = [];

    for (const change of changes) {
        if (change.type !== "remove") {
            continue;
        }

        const node = nodeById.get(change.id);
        if (node?.data.assetId) {
            assetIds.push(node.data.assetId);
        }
    }

    return assetIds;
}
