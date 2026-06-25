import type { Connection, Edge } from "@xyflow/react";
import { defaultCanvasEdgeOptions } from "@/components/canvas/canvasEdgeTypes";

// 构建带流动效果的画布连线
export function buildCanvasFlowEdge(
    edge: Connection | (Pick<Edge, "id" | "source" | "target"> & Partial<Pick<Edge, "sourceHandle" | "targetHandle">>),
): Edge {
    return {
        ...edge,
        type: defaultCanvasEdgeOptions.type,
    } as Edge;
}
