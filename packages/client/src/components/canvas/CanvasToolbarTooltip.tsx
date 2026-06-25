// 画布工具栏按钮 Tooltip 封装
import type { ReactElement } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type CanvasToolbarTooltipProps = {
    label: string;
    children: ReactElement;
    side?: "top" | "right" | "bottom" | "left";
    open?: boolean;
};

// 为画布工具栏图标按钮提供统一 Tooltip
export function CanvasToolbarTooltip({
    label,
    children,
    side = "right",
    open,
}: CanvasToolbarTooltipProps) {
    return (
        <Tooltip {...(open !== undefined ? { open } : {})}>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent side={side}>{label}</TooltipContent>
        </Tooltip>
    );
}
