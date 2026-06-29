// API KEY 设置按钮：打开火山方舟 Key 配置弹窗
import { Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CanvasToolbarTooltip } from "@/components/canvas/CanvasToolbarTooltip";
import { ArkApiKeySettingsDialog } from "@/components/home/ArkApiKeySettingsDialog";
import { hasCustomArkApiKey, ARK_API_KEY_CHANGED_EVENT } from "@/lib/arkApiKeyStorage";
import {
    hasCustomOpenaiApiKey,
    OPENAI_API_KEY_CHANGED_EVENT,
} from "@/lib/openaiApiKeyStorage";
import { cn } from "@/lib/utils";

type ArkApiKeySettingsButtonProps = {
    variant?: "titlebar" | "canvas" | "episode";
    tooltipLabel?: string;
    className?: string;
};

// variantClassMap 不同顶栏场景下的按钮样式
const variantClassMap = {
    titlebar:
        "relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-slate-50",
    canvas:
        "relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-black/5 bg-white/95 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white",
    episode:
        "relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-black/5",
} as const;

// 渲染 API KEY 设置按钮与弹窗
export function ArkApiKeySettingsButton({
    variant = "titlebar",
    tooltipLabel,
    className,
}: ArkApiKeySettingsButtonProps) {
    // settingsOpen 设置弹窗是否打开
    const [settingsOpen, setSettingsOpen] = useState(false);
    // usingCustomKey 是否已配置任一自定义 Key
    const [usingCustomKey, setUsingCustomKey] = useState(
        () => hasCustomArkApiKey() || hasCustomOpenaiApiKey(),
    );

    useEffect(() => {
        const refreshCustomKeyState = () => {
            setUsingCustomKey(hasCustomArkApiKey() || hasCustomOpenaiApiKey());
        };

        window.addEventListener(ARK_API_KEY_CHANGED_EVENT, refreshCustomKeyState);
        window.addEventListener(OPENAI_API_KEY_CHANGED_EVENT, refreshCustomKeyState);

        return () => {
            window.removeEventListener(ARK_API_KEY_CHANGED_EVENT, refreshCustomKeyState);
            window.removeEventListener(OPENAI_API_KEY_CHANGED_EVENT, refreshCustomKeyState);
        };
    }, []);

    // 打开设置弹窗
    const handleOpenSettings = useCallback(() => {
        setSettingsOpen(true);
    }, []);

    // 关闭设置弹窗并刷新自定义 Key 状态
    const handleCloseSettings = useCallback(() => {
        setSettingsOpen(false);
        setUsingCustomKey(hasCustomArkApiKey() || hasCustomOpenaiApiKey());
    }, []);

    const triggerButton = (
        <button
            type="button"
            aria-label="API KEY"
            className={cn(variantClassMap[variant], className)}
            onClick={handleOpenSettings}
        >
            <Settings className="size-4 text-slate-900" strokeWidth={1.8} />
            {usingCustomKey ? (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-emerald-500" />
            ) : null}
        </button>
    );

    return (
        <>
            {tooltipLabel ? (
                <CanvasToolbarTooltip label={tooltipLabel} side="bottom">
                    {triggerButton}
                </CanvasToolbarTooltip>
            ) : (
                triggerButton
            )}

            <ArkApiKeySettingsDialog open={settingsOpen} onClose={handleCloseSettings} />
        </>
    );
}
