// 弹层 fixed 定位纯函数（供 hook 与测试复用）
import type { PromptPopoverPlacement } from "@/hooks/usePromptPopoverPosition";

// PromptPopoverPositionInput 定位计算输入
export type PromptPopoverPositionInput = {
    triggerRect: Pick<DOMRect, "top" | "left" | "right" | "bottom" | "width" | "height">;
    panelWidth: number;
    panelHeight: number;
    placement: PromptPopoverPlacement;
    viewportWidth: number;
    viewportHeight: number;
    viewportMargin?: number;
    gap?: number;
};

// VIEWPORT_MARGIN 弹层与视口边缘的最小间距
const DEFAULT_VIEWPORT_MARGIN = 8;

// POPOVER_GAP 弹层与触发器之间的间距
const DEFAULT_POPOVER_GAP = 8;

// 计算弹层在视口内的 fixed 坐标
export function computePromptPopoverPosition({
    triggerRect,
    panelWidth,
    panelHeight,
    placement,
    viewportWidth,
    viewportHeight,
    viewportMargin = DEFAULT_VIEWPORT_MARGIN,
    gap = DEFAULT_POPOVER_GAP,
}: PromptPopoverPositionInput) {
    let left = triggerRect.left;

    if (left + panelWidth > viewportWidth - viewportMargin) {
        left = triggerRect.right - panelWidth;
    }

    left = Math.max(
        viewportMargin,
        Math.min(left, viewportWidth - panelWidth - viewportMargin),
    );

    let top =
        placement === "bottom"
            ? triggerRect.bottom + gap
            : triggerRect.top - panelHeight - gap;

    if (placement === "bottom" && top + panelHeight > viewportHeight - viewportMargin) {
        top = triggerRect.top - panelHeight - gap;
    } else if (placement === "top" && top < viewportMargin) {
        top = triggerRect.bottom + gap;
    }

    top = Math.max(
        viewportMargin,
        Math.min(top, viewportHeight - panelHeight - viewportMargin),
    );

    return { top, left };
}
