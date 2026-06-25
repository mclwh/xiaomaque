// 通用胶囊按钮：统一弹窗中重复的取消/确认按钮样式
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * pillButtonVariants 胶囊按钮样式变体
 * variant primary 主操作（黑底）/ danger 危险操作（红底）/ outline 次操作（描边）
 * size md 弹窗默认尺寸
 */
const pillButtonVariants = cva(
    "inline-flex cursor-pointer items-center justify-center gap-1 rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    {
        variants: {
            variant: {
                primary: "bg-black text-white hover:bg-black/85",
                danger: "bg-[#ff6b6b] text-white hover:bg-[#ff5a5a]",
                outline: "border border-slate-200 text-slate-600 hover:bg-slate-50",
            },
            size: {
                md: "px-4 py-2 text-sm",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
);

type PillButtonProps = React.ComponentProps<"button"> & VariantProps<typeof pillButtonVariants>;

// 渲染胶囊按钮
export function PillButton({ className, variant, size, type = "button", ...props }: PillButtonProps) {
    return (
        <button type={type} className={cn(pillButtonVariants({ variant, size, className }))} {...props} />
    );
}
