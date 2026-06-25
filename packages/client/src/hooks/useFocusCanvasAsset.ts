// 将画布视口居中到指定资产节点并选中
import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { centerCanvasNodeInViewport } from "@/lib/canvasFocusAsset";
import { getCanvasNodeId } from "@/lib/canvasNodes";
import { focusCanvasAsset } from "@/store/canvasSlice";
import { useAppDispatch } from "@/store/hooks";

type FocusCanvasAssetOptions = {
    skipMeasureWait?: boolean;
};

// 提供定位并选中画布资产节点的能力
export function useFocusCanvasAsset() {
    const dispatch = useAppDispatch();
    const { getNode, setCenter } = useReactFlow();

    // 将视口移动到资产节点并选中
    const focusCanvasAssetById = useCallback(
        (assetId: number, options?: FocusCanvasAssetOptions) => {
            const nodeId = getCanvasNodeId(assetId);

            centerCanvasNodeInViewport(
                { getNode, setCenter },
                nodeId,
                (success) => {
                    if (!success) {
                        return;
                    }

                    dispatch(focusCanvasAsset(assetId));
                },
                options,
            );
        },
        [dispatch, getNode, setCenter],
    );

    return { focusCanvasAssetById };
}
