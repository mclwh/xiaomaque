// 自由画布：基于 React Flow 的无限画布，状态由 Redux 管理
import { useCallback, useRef } from "react";
import { shallowEqual } from "react-redux";
import {
    Background,
    MiniMap,
    ReactFlow,
    useReactFlow,
    type Connection,
    type Edge,
    type EdgeChange,
    type Node,
    type NodeChange,
    type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { canvasNodeTypes } from "@/components/canvas/canvasNodeTypes";
import { canvasEdgeTypes, defaultCanvasEdgeOptions } from "@/components/canvas/canvasEdgeTypes";
import { CANVAS_SNAP_GRID, shouldUseCanvasPerformanceMode } from "@/lib/canvasConfig";
import { collectRemovedAssetIds } from "@/lib/canvasNodes";
import type { CanvasAssetNodeData } from "@/store/types/canvas";
import { useCanvasDragNodes } from "@/hooks/useCanvasDragNodes";
import { useCanvasKeyboardShortcuts } from "@/hooks/useCanvasKeyboardShortcuts";
import { useCanvasSpatialIndex } from "@/hooks/useCanvasSpatialIndex";
import {
    edgeConnected,
    edgesChanged,
    pushCanvasHistorySnapshot,
    setSelectionViaBox,
    stageCanvasNodesRemoval,
} from "@/store/canvasSlice";
import { useFocusCanvasAssetFromQuery } from "@/components/canvas/useFocusCanvasAssetFromQuery";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type FreeCanvasFlowProps = {
    projectId: number;
};

// 渲染 React Flow 无限画布
export function FreeCanvasFlow({ projectId }: FreeCanvasFlowProps) {
    const dispatch = useAppDispatch();
    const { getNodes } = useReactFlow();
    const reduxNodes = useAppSelector((state) => state.canvas.nodes);
    const edges = useAppSelector((state) => state.canvas.edges, shallowEqual);
    const snapToGrid = useAppSelector((state) => state.canvas.snapToGrid);
    const showMinimap = useAppSelector((state) => state.canvas.showMinimap);
    const flowWrapperRef = useRef<HTMLDivElement>(null);
    const isPerformanceMode = shouldUseCanvasPerformanceMode(reduxNodes.length);

    const { displayNodes, onNodesChange: onDragAwareNodesChange, onNodeDragStart } =
        useCanvasDragNodes({ reduxNodes, dispatch });

    useCanvasSpatialIndex({ nodes: reduxNodes });
    useFocusCanvasAssetFromQuery({ isPerformanceMode });
    useCanvasKeyboardShortcuts({ containerRef: flowWrapperRef });

    // 同步节点变更，Delete 删除仅本地暂存，退出画布时再批量调用接口
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
            const removeChanges: Extract<NodeChange, { type: "remove" }>[] = [];
            const otherChanges: NodeChange[] = [];

            for (const change of changes) {
                if (change.type === "remove") {
                    removeChanges.push(change);
                } else {
                    otherChanges.push(change);
                }
            }

            if (otherChanges.length > 0) {
                onDragAwareNodesChange(otherChanges);
            }

            if (removeChanges.length === 0) {
                return;
            }

            dispatch(pushCanvasHistorySnapshot());
            const assetIds = collectRemovedAssetIds(
                getNodes() as Node<CanvasAssetNodeData>[],
                removeChanges,
            );
            if (assetIds.length > 0) {
                dispatch(stageCanvasNodesRemoval(assetIds));
            }
        },
        [dispatch, getNodes, onDragAwareNodesChange],
    );

    // 同步连线变更
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            dispatch(edgesChanged(changes));
        },
        [dispatch],
    );

    // 连接节点时追加边（禁止节点与自身连线）
    const onConnect = useCallback(
        (connection: Connection) => {
            if (connection.source === connection.target) {
                return;
            }

            dispatch(pushCanvasHistorySnapshot());
            dispatch(edgeConnected(connection));
        },
        [dispatch],
    );

    // 校验拖拽连线是否合法
    const isValidConnection = useCallback((connection: Connection | Edge) => {
        return connection.source !== connection.target;
    }, []);

    // 点击画布空白区域时获取焦点，并清除框选标记
    const handlePaneClick = useCallback(() => {
        dispatch(setSelectionViaBox(false));
        flowWrapperRef.current?.focus();
    }, [dispatch]);

    // 框选开始时标记，用于抑制编辑面板展示
    const handleSelectionStart = useCallback(() => {
        dispatch(setSelectionViaBox(true));
    }, [dispatch]);

    // 单击节点选中时清除框选标记，允许展示编辑面板
    const handleNodeClick: NodeMouseHandler = useCallback((_event, _node) => {
        dispatch(setSelectionViaBox(false));
    }, [dispatch]);

    return (
        <div
            ref={flowWrapperRef}
            tabIndex={0}
            className="relative h-full w-full outline-none [&_.react-flow]:bg-[#eef1f4]"
            data-project-id={projectId}
            data-performance-mode={isPerformanceMode ? "true" : "false"}
        >
            <ReactFlow
                nodes={displayNodes}
                edges={edges}
                nodeTypes={canvasNodeTypes}
                edgeTypes={canvasEdgeTypes}
                defaultEdgeOptions={defaultCanvasEdgeOptions}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStart={onNodeDragStart}
                isValidConnection={isValidConnection}
                onPaneClick={handlePaneClick}
                onSelectionStart={handleSelectionStart}
                onNodeClick={handleNodeClick}
                deleteKeyCode="Delete"
                panOnDrag={false}
                panActivationKeyCode="Space"
                selectionOnDrag
                snapToGrid={snapToGrid}
                snapGrid={CANVAS_SNAP_GRID}
                minZoom={0.2}
                maxZoom={2}
                onlyRenderVisibleElements={isPerformanceMode}
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={CANVAS_SNAP_GRID[0]} size={1.2} color="#cbd5e1" />
                {showMinimap ? (
                    <MiniMap
                        pannable
                        zoomable
                        className="!bottom-5 !right-5 overflow-hidden rounded-xl border border-black/5 shadow-sm"
                    />
                ) : null}
            </ReactFlow>
        </div>
    );
}
