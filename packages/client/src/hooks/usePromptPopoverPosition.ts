// 根据触发器与视口边界计算弹层 fixed 坐标
import { useCallback, useLayoutEffect, useState, type RefObject } from "react";
import { computePromptPopoverPosition } from "@/lib/promptPopoverPosition";

// PromptPopoverPlacement 弹层相对触发器的垂直方向
export type PromptPopoverPlacement = "top" | "bottom";

// PromptPopoverFixedPosition 弹层 fixed 定位坐标
export type PromptPopoverFixedPosition = {
    top: number;
    left: number;
};

// 计算弹层在视口内的 fixed 坐标（水平贴边、垂直可翻转）
export function usePromptPopoverPosition(
    triggerRef: RefObject<HTMLElement | null>,
    panelRef: RefObject<HTMLElement | null>,
    open: boolean,
    placement: PromptPopoverPlacement,
) {
    const [position, setPosition] = useState<PromptPopoverFixedPosition | null>(null);

    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current;
        const panel = panelRef.current;

        if (!trigger || !panel) {
            return;
        }

        const triggerRect = trigger.getBoundingClientRect();

        setPosition(
            computePromptPopoverPosition({
                triggerRect,
                panelWidth: panel.offsetWidth,
                panelHeight: panel.offsetHeight,
                placement,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
            }),
        );
    }, [placement, panelRef, triggerRef]);

    useLayoutEffect(() => {
        if (!open) {
            setPosition(null);
            return;
        }

        updatePosition();
    }, [open, updatePosition]);

    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        const handleReposition = () => updatePosition();

        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);

        return () => {
            window.removeEventListener("resize", handleReposition);
            window.removeEventListener("scroll", handleReposition, true);
        };
    }, [open, updatePosition]);

    return position;
}
