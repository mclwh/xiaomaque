import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import { getCanvasNodeDimensions } from "@/components/canvas/canvasNodeConfig";

// ScreenToFlowPosition React Flow 屏幕坐标转画布坐标函数
type ScreenToFlowPosition = (position: { x: number; y: number }) => { x: number; y: number };

// 计算新节点在可见画布区域居中时的左上角坐标
export function getViewportCenterNodePosition(
    screenToFlowPosition: ScreenToFlowPosition,
    kind: CanvasNodeKind,
) {
    /*
     * pane React Flow 可见区域 DOM
     * bounds 可见区域屏幕边界
     * dimensions 节点宽高
     * center 视口中心对应的画布坐标
     */
    const pane = document.querySelector(".react-flow");
    const bounds = pane?.getBoundingClientRect() ?? {
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
    };
    const dimensions = getCanvasNodeDimensions(kind);
    const center = screenToFlowPosition({
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
    });

    return {
        x: center.x - dimensions.width / 2,
        y: center.y - dimensions.height / 2,
    };
}
