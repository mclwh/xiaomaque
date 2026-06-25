// 右上角仅手动关闭的通知
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type TopRightNoticeProps = {
    message: string;
    open: boolean;
    onClose: () => void;
    variant?: "error" | "warning";
    className?: string;
};

// variantClassMap 不同通知类型的样式
const variantClassMap = {
    error: {
        panel: "border-red-200 bg-red-50 text-red-600",
        button: "text-red-400 hover:bg-red-100 hover:text-red-600",
    },
    warning: {
        panel: "border-amber-200 bg-amber-50 text-amber-800",
        button: "text-amber-500 hover:bg-amber-100 hover:text-amber-700",
    },
} as const;

// 在视口右上角展示需手动关闭的通知
export function TopRightNotice({
    message,
    open,
    onClose,
    variant = "error",
    className,
}: TopRightNoticeProps) {
    if (!open || !message) {
        return null;
    }

    const styles = variantClassMap[variant];

    return createPortal(
        <div
            className={cn(
                "pointer-events-auto fixed top-4 right-4 z-[110] max-w-sm",
                className,
            )}
        >
            <div
                role="alert"
                className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg",
                    styles.panel,
                )}
            >
                <p className="flex-1 leading-6">{message}</p>
                <button
                    type="button"
                    aria-label="关闭通知"
                    className={cn(
                        "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition",
                        styles.button,
                    )}
                    onClick={onClose}
                >
                    <X className="size-4" strokeWidth={2} />
                </button>
            </div>
        </div>,
        document.body,
    );
}
