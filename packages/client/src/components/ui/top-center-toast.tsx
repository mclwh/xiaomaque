// 顶部水平居中轻提示，适用于发送成功等短时反馈
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type TopCenterToastProps = {
    message: string;
    /** 每次递增可强制重复展示相同文案 */
    notifyKey?: number;
    onClose: () => void;
    duration?: number;
    className?: string;
    variant?: "default" | "error";
};

// 在视口顶部居中展示带入场/退场动画的自动消失提示
export function TopCenterToast({
    message,
    notifyKey = 0,
    onClose,
    duration = 3000,
    className,
    variant = "default",
}: TopCenterToastProps) {
    // visible 是否挂载 Toast
    const [visible, setVisible] = useState(false);
    // content 当前展示文案
    const [content, setContent] = useState("");
    // exiting 是否正在播放退场动画
    const [exiting, setExiting] = useState(false);
    // dismissTimerRef 自动关闭定时器
    const dismissTimerRef = useRef<number | null>(null);

    // 清除自动关闭定时器
    const clearDismissTimer = useCallback(() => {
        if (dismissTimerRef.current !== null) {
            window.clearTimeout(dismissTimerRef.current);
            dismissTimerRef.current = null;
        }
    }, []);

    // 开始退场动画
    const startExit = useCallback(() => {
        clearDismissTimer();
        setExiting(true);
    }, [clearDismissTimer]);

    // message / notifyKey 变化时展示或触发退场
    useEffect(() => {
        if (message) {
            clearDismissTimer();
            setContent(message);
            setExiting(false);
            setVisible(true);
            dismissTimerRef.current = window.setTimeout(startExit, duration);
            return;
        }

        if (visible) {
            startExit();
        }
    }, [clearDismissTimer, duration, message, notifyKey, startExit, visible]);

    useEffect(() => {
        return () => {
            clearDismissTimer();
        };
    }, [clearDismissTimer]);

    // 退场动画结束后卸载并通知外部
    const handleAnimationEnd = useCallback(() => {
        if (!exiting) {
            return;
        }

        setVisible(false);
        setContent("");
        setExiting(false);
        onClose();
    }, [exiting, onClose]);

    if (!visible) {
        return null;
    }

    return createPortal(
        <div
            className={cn(
                "xyq-top-center-toast pointer-events-none fixed top-6 left-1/2 z-[100] -translate-x-1/2",
                className,
            )}
        >
            <div
                role="status"
                aria-live={variant === "error" ? "assertive" : "polite"}
                className={cn(
                    "xyq-top-center-toast__panel rounded-full px-5 py-2.5 text-sm font-medium shadow-lg backdrop-blur-sm",
                    exiting
                        ? "xyq-top-center-toast__panel--leave"
                        : "xyq-top-center-toast__panel--enter",
                    variant === "error"
                        ? "border border-red-200/90 bg-red-50/95 text-red-500"
                        : "bg-slate-900/90 text-white",
                )}
                onAnimationEnd={handleAnimationEnd}
            >
                {content}
            </div>
        </div>,
        document.body,
    );
}
