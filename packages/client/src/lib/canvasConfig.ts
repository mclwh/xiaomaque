// 画布网格步长（与 Background gap 保持一致）
export const CANVAS_SNAP_GRID: [number, number] = [20, 20];

// CANVAS_SPATIAL_INDEX_THRESHOLD 启用性能模式（空间索引 + 视口裁剪）的节点数阈值
export const CANVAS_SPATIAL_INDEX_THRESHOLD = 200;

// 判断节点数是否应启用画布性能模式
export function shouldUseCanvasPerformanceMode(nodeCount: number): boolean {
    return nodeCount > CANVAS_SPATIAL_INDEX_THRESHOLD;
}

// shouldUseCanvasSpatialIndex 是否应维护 R-tree 空间索引（与性能模式一致）
export function shouldUseCanvasSpatialIndex(nodeCount: number): boolean {
    return shouldUseCanvasPerformanceMode(nodeCount);
}
