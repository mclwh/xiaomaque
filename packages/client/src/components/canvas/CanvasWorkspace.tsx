// 画布工作区：React Flow 与 overlay UI 组合
import { useCallback, useEffect } from "react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CanvasNodeActionsProvider } from "@/components/canvas/CanvasNodeActionsContext";
import { CanvasBottomControls } from "@/components/canvas/CanvasBottomControls";
import { CanvasLeftToolbar } from "@/components/canvas/CanvasLeftToolbar";
import { CanvasNodeSelector } from "@/components/canvas/CanvasNodeSelector";
import { CanvasTopBar } from "@/components/canvas/CanvasTopBar";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import { FreeCanvasFlow } from "@/components/canvas/FreeCanvasFlow";
import { CanvasMediaImagePreview } from "@/components/canvas/CanvasMediaImagePreview";
import { useCanvasAutoSave } from "@/hooks/useCanvasAutoSave";
import { getViewportCenterNodePosition } from "@/lib/canvasViewport";
import {
    createCanvasAsset,
    deleteCanvasAssets,
    loadCanvasAssets,
    pushCanvasHistorySnapshot,
    resetCanvas,
    selectAssetCreating,
    selectShowNodeSelector,
} from "@/store/canvasSlice";
import { store } from "@/store/index";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type CanvasWorkspaceProps = {
    projectId: number;
};

// 渲染画布主体与各区域 overlay
function CanvasWorkspaceContent({ projectId }: CanvasWorkspaceProps) {
    const dispatch = useAppDispatch();
    const { screenToFlowPosition } = useReactFlow();
    const showNodeSelector = useAppSelector(selectShowNodeSelector);
    const assetCreating = useAppSelector(selectAssetCreating);
    const errorMessage = useAppSelector((state) => state.canvas.errorMessage);

    useCanvasAutoSave();

    useEffect(() => {
        if (!Number.isFinite(projectId) || projectId <= 0) {
            return;
        }

        const loadRequest = dispatch(loadCanvasAssets(projectId));

        return () => {
            loadRequest.abort();
            // pendingIds 退出画布前暂存的待删除资产 ID
            const pendingIds = [...store.getState().canvas.pendingDeleteAssetIds];
            if (pendingIds.length > 0) {
                void dispatch(deleteCanvasAssets(pendingIds));
            }
            dispatch(resetCanvas());
        };
    }, [dispatch, projectId]);

    // 创建资产并在 Redux 中同步画布节点（新节点落在当前视口中心）
    const handleSelectNode = useCallback(
        (kind: CanvasNodeKind) => {
            if (assetCreating) {
                return;
            }

            const position = getViewportCenterNodePosition(screenToFlowPosition, kind);

            dispatch(pushCanvasHistorySnapshot());
            void dispatch(
                createCanvasAsset({
                    project_id: projectId,
                    type: kind,
                    position,
                }),
            );
        },
        [assetCreating, dispatch, projectId, screenToFlowPosition],
    );

    return (
        <CanvasNodeActionsProvider>
            <div className="relative h-full w-full">
                <FreeCanvasFlow projectId={projectId} />

                <CanvasTopBar />
                <CanvasLeftToolbar onSelectNode={handleSelectNode} />
                <CanvasBottomControls />

                {showNodeSelector ? (
                    <CanvasNodeSelector onSelect={handleSelectNode} />
                ) : null}

                {errorMessage ? (
                    <p className="pointer-events-none absolute top-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-red-50 px-4 py-2 text-sm text-red-600">
                        {errorMessage}
                    </p>
                ) : null}

                <CanvasMediaImagePreview />
            </div>
        </CanvasNodeActionsProvider>
    );
}

// 提供 React Flow 上下文并挂载画布工作区
export function CanvasWorkspace({ projectId }: CanvasWorkspaceProps) {
    return (
        <TooltipProvider>
            <ReactFlowProvider>
                <CanvasWorkspaceContent projectId={projectId} />
            </ReactFlowProvider>
        </TooltipProvider>
    );
}
