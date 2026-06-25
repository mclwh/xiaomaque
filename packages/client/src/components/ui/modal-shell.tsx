// 通用模态外壳：居中遮罩层 + 卡片容器，点击遮罩关闭、卡片内阻止冒泡
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModalShellProps = {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
};

// 渲染居中模态外壳
export function ModalShell({ open, onClose, children, className }: ModalShellProps) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className={cn(
                    "w-full max-w-[420px] rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]",
                    className,
                )}
                onClick={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
