// 添加节点按钮 Plus / X 切换图标（带过渡动画）
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CanvasAddNodeIconProps = {
    active: boolean;
};

// 渲染带旋转缩放过渡的加减图标
export function CanvasAddNodeIcon({ active }: CanvasAddNodeIconProps) {
    return (
        <span className="relative block size-5">
            <Plus
                className={cn(
                    "absolute inset-0 size-5 transition-all duration-200 ease-out",
                    active ? "scale-75 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
                )}
                strokeWidth={2}
            />
            <X
                className={cn(
                    "absolute inset-0 size-5 transition-all duration-200 ease-out",
                    active ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-90 opacity-0",
                )}
                strokeWidth={2}
            />
        </span>
    );
}
