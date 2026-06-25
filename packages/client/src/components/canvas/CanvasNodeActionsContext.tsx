// 工作区级节点操作上下文：收窄 AddButton 的 Redux 订阅
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import {
    createContextCanvasAsset,
    createReferencedCanvasAsset,
    pushCanvasHistorySnapshot,
    selectAssetCreating,
} from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type CanvasNodeActionsContextValue = {
    projectId: number | null;
    assetCreating: boolean;
    createContextAsset: (payload: {
        type: CanvasNodeKind;
        targetNodeId: string;
    }) => void;
    createReferencedAsset: (payload: {
        type: CanvasNodeKind;
        sourceNodeId: string;
    }) => void;
};

// defaultValue 默认空操作上下文
const defaultValue: CanvasNodeActionsContextValue = {
    projectId: null,
    assetCreating: false,
    createContextAsset: () => {},
    createReferencedAsset: () => {},
};

// CanvasNodeActionsContext 节点操作上下文
const CanvasNodeActionsContext = createContext(defaultValue);

type CanvasNodeActionsProviderProps = {
    children: ReactNode;
};

// 提供工作区级节点创建操作
export function CanvasNodeActionsProvider({ children }: CanvasNodeActionsProviderProps) {
    const dispatch = useAppDispatch();
    const projectId = useAppSelector((state) => state.canvas.projectId);
    const assetCreating = useAppSelector(selectAssetCreating);

    // 创建上下文节点
    const createContextAsset = useCallback(
        (payload: { type: CanvasNodeKind; targetNodeId: string }) => {
            if (!projectId || assetCreating) {
                return;
            }

            dispatch(pushCanvasHistorySnapshot());
            void dispatch(
                createContextCanvasAsset({
                    project_id: projectId,
                    type: payload.type,
                    targetNodeId: payload.targetNodeId,
                }),
            );
        },
        [assetCreating, dispatch, projectId],
    );

    // 创建引用节点
    const createReferencedAsset = useCallback(
        (payload: { type: CanvasNodeKind; sourceNodeId: string }) => {
            if (!projectId || assetCreating) {
                return;
            }

            dispatch(pushCanvasHistorySnapshot());
            void dispatch(
                createReferencedCanvasAsset({
                    project_id: projectId,
                    type: payload.type,
                    sourceNodeId: payload.sourceNodeId,
                }),
            );
        },
        [assetCreating, dispatch, projectId],
    );

    const value = useMemo(
        () => ({
            projectId,
            assetCreating,
            createContextAsset,
            createReferencedAsset,
        }),
        [assetCreating, createContextAsset, createReferencedAsset, projectId],
    );

    return (
        <CanvasNodeActionsContext.Provider value={value}>{children}</CanvasNodeActionsContext.Provider>
    );
}

// 读取工作区级节点操作
export function useCanvasNodeActions() {
    return useContext(CanvasNodeActionsContext);
}
