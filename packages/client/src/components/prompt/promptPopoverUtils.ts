// 弹层通用交互配置
import type { MouseEvent } from "react";

// PromptPopoverInteractionProps 弹层交互配置
export type PromptPopoverInteractionProps = {
    interactionScope?: "canvas" | "default";
    popoverPlacement?: "top" | "bottom";
};

// PromptPopoverPositionMode 弹层定位模式
export type PromptPopoverPositionMode = "absolute" | "fixed";

// 返回弹层容器 className
export function getPromptPopoverPanelClassName({
    interactionScope = "default",
    popoverPlacement = "top",
    positionMode = "absolute",
    widthClassName = "w-[320px]",
}: PromptPopoverInteractionProps & {
    positionMode?: PromptPopoverPositionMode;
    widthClassName?: string;
}) {
    const absolutePositionClasses =
        positionMode === "absolute"
            ? [
                  "absolute left-0",
                  popoverPlacement === "top" ? "bottom-full mb-2" : "top-full mt-2",
              ]
            : [];

    return [
        "z-50 rounded-2xl border border-black/5 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.12)]",
        widthClassName,
        ...absolutePositionClasses,
        interactionScope === "canvas" ? "nodrag nopan" : "",
    ]
        .filter(Boolean)
        .join(" ");
}

// 阻止画布交互冒泡
export function handlePromptPopoverMouseDown(
    event: MouseEvent,
    interactionScope: PromptPopoverInteractionProps["interactionScope"] = "default",
) {
    if (interactionScope === "canvas") {
        event.stopPropagation();
    }
}
