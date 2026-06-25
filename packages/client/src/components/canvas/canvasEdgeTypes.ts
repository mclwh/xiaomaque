// React Flow 自定义连线类型映射（需在组件外保持引用稳定）
import { CanvasFlowEdge } from "@/components/canvas/edges/CanvasFlowEdge";

/*
 * canvasEdgeTypes 画布连线类型注册表
 */
export const canvasEdgeTypes = {
    canvasFlow: CanvasFlowEdge,
};

// defaultCanvasEdgeOptions 新建连线默认配置
export const defaultCanvasEdgeOptions = {
    type: "canvasFlow" as const,
};
