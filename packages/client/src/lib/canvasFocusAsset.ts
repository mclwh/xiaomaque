import type { useReactFlow } from "@xyflow/react";

// FOCUS_CENTER_MAX_ATTEMPTS 等待节点测量后再居中的最大重试次数
export const FOCUS_CENTER_MAX_ATTEMPTS = 20;

// FOCUS_CENTER_ANIMATION_MS 视口居中动画时长，需与 setCenter duration 保持一致
export const FOCUS_CENTER_ANIMATION_MS = 300;

type ReactFlowViewportApi = Pick<ReturnType<typeof useReactFlow>, "getNode" | "setCenter">;

// 将指定画布节点移动到视口水平垂直居中
export function centerCanvasNodeInViewport(
    { getNode, setCenter }: ReactFlowViewportApi,
    nodeId: string,
    onComplete: (success: boolean) => void,
    options: { skipMeasureWait?: boolean } = {},
    attempt = 0,
) {
    const node = getNode(nodeId);

    if (!node) {
        if (attempt < FOCUS_CENTER_MAX_ATTEMPTS) {
            window.requestAnimationFrame(() => {
                centerCanvasNodeInViewport(
                    { getNode, setCenter },
                    nodeId,
                    onComplete,
                    options,
                    attempt + 1,
                );
            });
            return;
        }

        onComplete(false);
        return;
    }

    const width = node.measured?.width ?? node.width ?? 200;
    const height = node.measured?.height ?? node.height ?? 280;
    const hasPresetSize = Boolean(node.width && node.height);
    const hasMeasuredSize = Boolean(node.measured?.width && node.measured?.height);

    if (
        !options.skipMeasureWait &&
        !hasPresetSize &&
        !hasMeasuredSize &&
        attempt < FOCUS_CENTER_MAX_ATTEMPTS
    ) {
        window.requestAnimationFrame(() => {
            centerCanvasNodeInViewport(
                { getNode, setCenter },
                nodeId,
                onComplete,
                options,
                attempt + 1,
            );
        });
        return;
    }

    setCenter(node.position.x + width / 2, node.position.y + height / 2, {
        zoom: 1,
        duration: FOCUS_CENTER_ANIMATION_MS,
    });

    window.setTimeout(() => {
        onComplete(true);
    }, FOCUS_CENTER_ANIMATION_MS);
}
