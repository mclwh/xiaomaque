// 分集编辑页：点击时长标签后弹出的时长设置面板
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    FRAGMENT_CONTENT_DURATION_MAX,
    FRAGMENT_DURATION_PRESET_OPTIONS,
    canReplaceFragmentDurationInContent,
    resolveFragmentDurationReplaceError,
    sumFragmentContentDurationSeconds,
} from "@/lib/episodeFragmentDuration";
import type { MentionCaretRect } from "@/lib/promptMention";
import { cn } from "@/lib/utils";

type EpisodeDurationChipPopoverProps = {
    open: boolean;
    anchorRect: MentionCaretRect | null;
    currentSeconds: number;
    getEditorContent: () => string;
    onSelect: (seconds: number) => void;
    onClose: () => void;
    onValidationError?: (message: string) => void;
};

// 渲染时长标签编辑弹层
function EpisodeDurationChipPopoverComponent({
    open,
    anchorRect,
    currentSeconds,
    getEditorContent,
    onSelect,
    onClose,
    onValidationError,
}: EpisodeDurationChipPopoverProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    // activeIndex 键盘高亮索引
    const [activeIndex, setActiveIndex] = useState(0);
    // customDuration 自定义时长输入
    const [customDuration, setCustomDuration] = useState("");

    useEffect(() => {
        if (!open) {
            setActiveIndex(0);
            setCustomDuration("");
        }
    }, [open]);

    // 判断替换当前标签后是否超过上限
    const canSetDuration = useCallback(
        (seconds: number) => {
            const editorContent = getEditorContent();
            return canReplaceFragmentDurationInContent(editorContent, currentSeconds, seconds);
        },
        [currentSeconds, getEditorContent],
    );

    // 选中预设或自定义时长
    const handleSelectDurationSeconds = useCallback(
        (seconds: number) => {
            const editorContent = getEditorContent();
            const errorMessage = resolveFragmentDurationReplaceError(
                editorContent,
                currentSeconds,
                seconds,
            );

            if (errorMessage) {
                onValidationError?.(errorMessage);
                return;
            }

            onSelect(seconds);
        },
        [currentSeconds, getEditorContent, onSelect, onValidationError],
    );

    // 确认自定义时长
    const handleConfirmCustomDuration = useCallback(() => {
        const seconds = Number(customDuration.trim());
        handleSelectDurationSeconds(seconds);
    }, [customDuration, handleSelectDurationSeconds]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((current) =>
                    Math.min(current + 1, FRAGMENT_DURATION_PRESET_OPTIONS.length),
                );
                return;
            }

            if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((current) => Math.max(current - 1, 0));
                return;
            }

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            const preset = FRAGMENT_DURATION_PRESET_OPTIONS[activeIndex];

            if (preset !== undefined) {
                handleSelectDurationSeconds(preset);
                return;
            }

            handleConfirmCustomDuration();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [activeIndex, handleConfirmCustomDuration, handleSelectDurationSeconds, onClose, open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;

            if (panelRef.current?.contains(target)) {
                return;
            }

            onClose();
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [onClose, open]);

    if (!open || !anchorRect) {
        return null;
    }

    // panelTop 弹层顶部坐标
    const panelTop = Math.min(anchorRect.bottom + 8, window.innerHeight - 280);
    // panelLeft 弹层左侧坐标
    const panelLeft = Math.min(anchorRect.left, window.innerWidth - 240);
    // usedTotal 当前脚本已用时长
    const usedTotal = sumFragmentContentDurationSeconds(getEditorContent());

    const panel = (
        <div
            ref={panelRef}
            className="fixed z-80 w-[220px] rounded-2xl border border-black/5 bg-white p-3 shadow-[0_16px_48px_rgba(15,23,42,0.14)]"
            style={{
                top: panelTop,
                left: panelLeft,
            }}
            onMouseDown={(event) => event.stopPropagation()}
        >
            <p className="mb-2 px-1 text-xs text-slate-500">
                设置时长 · 已用 {usedTotal}s / {FRAGMENT_CONTENT_DURATION_MAX}s
            </p>
            <div className="space-y-1">
                {FRAGMENT_DURATION_PRESET_OPTIONS.map((seconds, index) => {
                    const disabled = !canSetDuration(seconds);

                    return (
                        <button
                            key={seconds}
                            type="button"
                            disabled={disabled}
                            className={cn(
                                "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                                activeIndex === index ? "bg-[#efeff4]" : "hover:bg-[#f3f3f7]",
                                seconds === currentSeconds && "font-medium text-violet-600",
                                disabled && "cursor-not-allowed opacity-40",
                            )}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => handleSelectDurationSeconds(seconds)}
                        >
                            <span className="size-1.5 rounded-full bg-slate-300" />
                            <span>{seconds}s</span>
                        </button>
                    );
                })}
                <div
                    className={cn(
                        "flex items-center gap-2 rounded-xl px-3 py-2",
                        activeIndex === FRAGMENT_DURATION_PRESET_OPTIONS.length ? "bg-[#efeff4]" : "",
                    )}
                    onMouseEnter={() => setActiveIndex(FRAGMENT_DURATION_PRESET_OPTIONS.length)}
                >
                    <span className="size-1.5 rounded-full bg-slate-300" />
                    <input
                        type="number"
                        min={1}
                        max={FRAGMENT_CONTENT_DURATION_MAX}
                        placeholder={`Max ${FRAGMENT_CONTENT_DURATION_MAX}`}
                        value={customDuration}
                        onChange={(event) => setCustomDuration(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                handleConfirmCustomDuration();
                            }
                        }}
                        className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-400"
                    />
                    <span className="text-sm text-slate-500">s</span>
                    <button
                        type="button"
                        className="ml-auto cursor-pointer rounded-lg px-2 py-1 text-xs text-violet-600 hover:bg-violet-50"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={handleConfirmCustomDuration}
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(panel, document.body);
}

export const EpisodeDurationChipPopover = memo(EpisodeDurationChipPopoverComponent);
