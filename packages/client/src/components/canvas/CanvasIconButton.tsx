// 画布工具条圆形图标按钮：统一控制条中重复的图标按钮样式
import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * active 是否处于激活态（如网格吸附开启），激活时使用深色底
 * disabledStyle 是否使用禁用置灰样式（与原生 disabled 区分，用于撤销/重做不可用态）
 */
type CanvasIconButtonProps = React.ComponentProps<"button"> & {
    active?: boolean;
    disabledStyle?: boolean;
};

// 渲染画布工具条圆形图标按钮
export function CanvasIconButton({
    active = false,
    disabledStyle = false,
    className,
    type = "button",
    ...props
}: CanvasIconButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                "inline-flex size-8 items-center justify-center rounded-full transition",
                disabledStyle
                    ? "cursor-not-allowed text-slate-600 opacity-40"
                    : active
                        ? "cursor-pointer bg-slate-900 text-white hover:bg-slate-800"
                        : "cursor-pointer text-slate-600 hover:bg-slate-100",
                className,
            )}
            {...props}
        />
    );
}
