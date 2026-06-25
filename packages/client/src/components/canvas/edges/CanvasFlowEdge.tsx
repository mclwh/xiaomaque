// 画布流动高亮连线（仅选中节点相关的入/出边展示流动效果）
import { memo } from "react";
import { BaseEdge, getBezierPath, useStore, type EdgeProps } from "@xyflow/react";

// 判断当前边是否与任一选中节点相连（用 nodeLookup 直接命中两端节点，O(1)）
function useEdgeConnectedToSelectedNode(source: string, target: string) {
    return useStore((state) => {
        const sourceSelected = state.nodeLookup.get(source)?.selected ?? false;
        const targetSelected = state.nodeLookup.get(target)?.selected ?? false;

        return sourceSelected || targetSelected;
    });
}

// 渲染带蓝色流动高亮的贝塞尔连线
function CanvasFlowEdgeComponent({
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
}: EdgeProps) {
    const showFlow = useEdgeConnectedToSelectedNode(source, target);
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    stroke: showFlow ? "#94a3b8" : "#cbd5e1",
                    strokeWidth: showFlow ? 2 : 1.5,
                }}
            />
            {showFlow ? (
                <path
                    d={edgePath}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="xyq-canvas-flow-edge"
                    pointerEvents="none"
                />
            ) : null}
        </>
    );
}

export const CanvasFlowEdge = memo(CanvasFlowEdgeComponent);
