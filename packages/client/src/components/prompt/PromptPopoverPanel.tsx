// 提示词弹层容器：Portal + 视口边界自适应定位
import { useRef, type MouseEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
    getPromptPopoverPanelClassName,
    handlePromptPopoverMouseDown,
    type PromptPopoverInteractionProps,
} from "@/components/prompt/promptPopoverUtils";
import { usePromptPopoverPosition } from "@/hooks/usePromptPopoverPosition";
import { cn } from "@/lib/utils";

type PromptPopoverPanelProps = PromptPopoverInteractionProps & {
    open: boolean;
    triggerRef: RefObject<HTMLElement | null>;
    widthClassName?: string;
    panelRef?: RefObject<HTMLDivElement | null>;
    className?: string;
    children: ReactNode;
    onMouseDown?: (event: MouseEvent) => void;
};

// 渲染挂载到 body 的弹层，按视口边界自动调整位置
export function PromptPopoverPanel({
    open,
    triggerRef,
    interactionScope = "default",
    popoverPlacement = "top",
    widthClassName = "w-[320px]",
    panelRef: externalPanelRef,
    className,
    children,
    onMouseDown,
}: PromptPopoverPanelProps) {
    const internalPanelRef = useRef<HTMLDivElement>(null);
    const panelRef = externalPanelRef ?? internalPanelRef;
    const position = usePromptPopoverPosition(triggerRef, panelRef, open, popoverPlacement);

    if (!open) {
        return null;
    }

    return createPortal(
        <div
            ref={panelRef}
            className={cn(
                getPromptPopoverPanelClassName({
                    interactionScope,
                    positionMode: "fixed",
                    widthClassName,
                }),
                position === null && "pointer-events-none opacity-0",
                className,
            )}
            style={
                position
                    ? {
                          position: "fixed",
                          top: position.top,
                          left: position.left,
                          zIndex: 50,
                      }
                    : {
                          position: "fixed",
                          top: 0,
                          left: 0,
                          visibility: "hidden",
                          zIndex: 50,
                      }
            }
            onMouseDown={(event) => {
                handlePromptPopoverMouseDown(event, interactionScope);
                onMouseDown?.(event);
            }}
        >
            {children}
        </div>,
        document.body,
    );
}
