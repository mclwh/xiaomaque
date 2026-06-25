// 根据 URL 中的 asset_id 定位并选中画布节点
import { useEffect, useRef } from "react";
import { useNodesInitialized, useReactFlow } from "@xyflow/react";
import { useSearchParams } from "react-router-dom";
import { centerCanvasNodeInViewport } from "@/lib/canvasFocusAsset";
import { getCanvasNodeId } from "@/lib/canvasNodes";
import { focusCanvasAsset, selectCanvasAssetById, selectCanvasNodeExists } from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// 解析 URL 中的 asset_id 查询参数
function parseFocusAssetId(searchParams: URLSearchParams) {
    const rawValue = searchParams.get("asset_id");
    const assetId = Number(rawValue);

    if (!rawValue || !Number.isFinite(assetId) || assetId <= 0) {
        return null;
    }

    return assetId;
}

type UseFocusCanvasAssetFromQueryOptions = {
    isPerformanceMode?: boolean;
};

// 在画布加载完成后定位到 URL 指定的资产节点
export function useFocusCanvasAssetFromQuery({
    isPerformanceMode = false,
}: UseFocusCanvasAssetFromQueryOptions = {}) {
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { getNode, setCenter } = useReactFlow();
    const nodesInitialized = useNodesInitialized();
    const assetsLoading = useAppSelector((state) => state.canvas.assetsLoading);
    const focusAssetId = parseFocusAssetId(searchParams);
    const targetNodeId = focusAssetId ? getCanvasNodeId(focusAssetId) : "";
    const targetNodeExists = useAppSelector(selectCanvasNodeExists(targetNodeId));
    const assetExists = useAppSelector((state) =>
        focusAssetId ? Boolean(selectCanvasAssetById(state, focusAssetId)) : false,
    );
    const focusedAssetIdRef = useRef<number | null>(null);
    const pendingFocusAssetIdRef = useRef<number | null>(null);

    useEffect(() => {
        let disposed = false;

        if (!focusAssetId) {
            focusedAssetIdRef.current = null;
            pendingFocusAssetIdRef.current = null;
            return;
        }

        if (assetsLoading || !nodesInitialized) {
            return;
        }

        if (
            focusedAssetIdRef.current === focusAssetId ||
            pendingFocusAssetIdRef.current === focusAssetId
        ) {
            return;
        }

        const clearAssetQuery = () => {
            if (!searchParams.get("asset_id")) {
                return;
            }

            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("asset_id");
            setSearchParams(nextParams, { replace: true });
        };

        if (!targetNodeExists) {
            if (!assetExists) {
                focusedAssetIdRef.current = focusAssetId;
                clearAssetQuery();
            }

            return;
        }

        pendingFocusAssetIdRef.current = focusAssetId;

        centerCanvasNodeInViewport(
            { getNode, setCenter },
            targetNodeId,
            (success) => {
                if (disposed) {
                    pendingFocusAssetIdRef.current = null;
                    return;
                }

                pendingFocusAssetIdRef.current = null;

                if (!success) {
                    return;
                }

                dispatch(focusCanvasAsset(focusAssetId));
                focusedAssetIdRef.current = focusAssetId;
                clearAssetQuery();
            },
            { skipMeasureWait: isPerformanceMode },
        );

        return () => {
            disposed = true;

            if (pendingFocusAssetIdRef.current === focusAssetId) {
                pendingFocusAssetIdRef.current = null;
            }
        };
    }, [
        assetExists,
        assetsLoading,
        dispatch,
        focusAssetId,
        getNode,
        isPerformanceMode,
        nodesInitialized,
        searchParams,
        setCenter,
        setSearchParams,
        targetNodeExists,
        targetNodeId,
    ]);
}
