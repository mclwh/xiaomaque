// React Flow 自定义节点类型映射（需在组件外保持引用稳定）
import { CanvasAssetNode } from "@/components/canvas/CanvasAssetNode";

/*
 * canvasNodeTypes 画布节点类型注册表
 */
export const canvasNodeTypes = {
    canvasAsset: CanvasAssetNode,
};
