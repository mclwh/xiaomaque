// 画布节点 R-tree 空间索引：视口矩形查询与增量维护
import RBush from "rbush";
import type { Node, Viewport } from "@xyflow/react";
import { getCanvasNodeDimensions } from "@/components/canvas/canvasNodeConfig";
import { shouldUseCanvasSpatialIndex } from "@/lib/canvasConfig";
import type { CanvasAssetNodeData } from "@/store/types/canvas";

// CanvasSpatialEntry rbush 条目（节点包围盒 + id）
export type CanvasSpatialEntry = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    id: string;
};

// CanvasSpatialIndex R-tree 实例类型
export type CanvasSpatialIndex = RBush<CanvasSpatialEntry>;

// FlowRect flow 坐标系下的查询矩形
export type FlowRect = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};

// DEFAULT_VIEWPORT_PADDING 视口查询缓冲（像素），避免边缘节点闪烁
const DEFAULT_VIEWPORT_PADDING = 200;

// 计算单个节点的 flow 坐标包围盒
export function getCanvasNodeBounds(node: Node<CanvasAssetNodeData>): FlowRect {
    /*
     * measuredWidth measuredHeight 已测量尺寸
     * preset 配置表默认尺寸
     * width height 最终宽高
     */
    const measuredWidth = node.measured?.width ?? node.width;
    const measuredHeight = node.measured?.height ?? node.height;
    const preset = getCanvasNodeDimensions(node.data.kind);
    const width = measuredWidth ?? preset.width;
    const height = measuredHeight ?? preset.height;

    return {
        minX: node.position.x,
        minY: node.position.y,
        maxX: node.position.x + width,
        maxY: node.position.y + height,
    };
}

// 将节点转为 rbush 条目
export function nodeToSpatialEntry(node: Node<CanvasAssetNodeData>): CanvasSpatialEntry {
    const bounds = getCanvasNodeBounds(node);

    return {
        ...bounds,
        id: node.id,
    };
}

// 全量构建空间索引
export function buildCanvasSpatialIndex(
    nodes: Node<CanvasAssetNodeData>[],
): CanvasSpatialIndex {
    const index = new RBush<CanvasSpatialEntry>();
    index.load(nodes.map(nodeToSpatialEntry));
    return index;
}

// 创建空索引
export function createEmptyCanvasSpatialIndex(): CanvasSpatialIndex {
    return new RBush<CanvasSpatialEntry>();
}

// 插入或更新单个节点（先删后插）
export function insertOrUpdateNode(
    index: CanvasSpatialIndex,
    node: Node<CanvasAssetNodeData>,
): void {
    removeNodeFromIndex(index, node.id);
    index.insert(nodeToSpatialEntry(node));
}

// 从索引移除节点
export function removeNodeFromIndex(index: CanvasSpatialIndex, nodeId: string): void {
    const existing = index.search({ minX: -Infinity, minY: -Infinity, maxX: Infinity, maxY: Infinity })
        .filter((entry) => entry.id === nodeId);

    for (const entry of existing) {
        index.remove(entry);
    }
}

// 矩形相交查询，返回 nodeId 列表
export function searchNodesInRect(index: CanvasSpatialIndex, rect: FlowRect): string[] {
    return index.search(rect).map((entry) => entry.id);
}

// 将 React Flow viewport 转为 flow 坐标查询矩形
export function flowRectFromViewport(
    viewport: Viewport,
    paneWidth: number,
    paneHeight: number,
    padding = DEFAULT_VIEWPORT_PADDING,
): FlowRect {
    /*
     * x y zoom 视口平移与缩放
     * minX minY maxX maxY flow 坐标系边界
     */
    const { x, y, zoom } = viewport;

    return {
        minX: (-x - padding) / zoom,
        minY: (-y - padding) / zoom,
        maxX: (paneWidth - x + padding) / zoom,
        maxY: (paneHeight - y + padding) / zoom,
    };
}

// 在视口矩形内搜索节点 id
export function searchNodesInViewport(
    index: CanvasSpatialIndex,
    viewport: Viewport,
    paneWidth: number,
    paneHeight: number,
    padding = DEFAULT_VIEWPORT_PADDING,
): string[] {
    const rect = flowRectFromViewport(viewport, paneWidth, paneHeight, padding);
    return searchNodesInRect(index, rect);
}

export { shouldUseCanvasSpatialIndex };
