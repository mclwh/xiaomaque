// 文本节点工具栏颜色选择器
import { useCallback, useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { handlePromptPopoverMouseDown } from "@/components/prompt/promptPopoverUtils";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import {
    applyTextColor,
    CANVAS_TEXT_DEFAULT_COLOR,
    CANVAS_TEXT_PRESET_COLORS,
    normalizeTextColor,
    queryTextColor,
} from "@/lib/canvasTextEditor";
import { cn } from "@/lib/utils";

type CanvasTextNodeColorPickerProps = {
    editorRef: RefObject<HTMLDivElement | null>;
    isPlain?: boolean;
    onBeforeCommand?: () => boolean;
    onColorChange?: () => void;
};

// 渲染文本颜色选择与预设面板
export function CanvasTextNodeColorPicker({
    editorRef,
    isPlain = false,
    onBeforeCommand,
    onColorChange,
}: CanvasTextNodeColorPickerProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const customColorInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [currentColor, setCurrentColor] = useState(CANVAS_TEXT_DEFAULT_COLOR);

    usePopoverDismiss(rootRef, open, () => setOpen(false));

    // 同步当前选区颜色到按钮展示
    const syncCurrentColor = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        const selection = document.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }

        if (!editor.contains(selection.anchorNode)) {
            return;
        }

        setCurrentColor(queryTextColor());
    }, [editorRef]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        editor.addEventListener("keyup", syncCurrentColor);
        editor.addEventListener("mouseup", syncCurrentColor);
        editor.addEventListener("focus", syncCurrentColor);
        document.addEventListener("selectionchange", syncCurrentColor);

        return () => {
            editor.removeEventListener("keyup", syncCurrentColor);
            editor.removeEventListener("mouseup", syncCurrentColor);
            editor.removeEventListener("focus", syncCurrentColor);
            document.removeEventListener("selectionchange", syncCurrentColor);
        };
    }, [editorRef, syncCurrentColor]);

    // 阻止点击导致编辑器失焦
    const handleToolbarMouseDown = (event: MouseEvent) => {
        event.preventDefault();
    };

    // 应用颜色到当前选区
    const handleApplyColor = (color: string) => {
        const shouldDefer = onBeforeCommand?.() ?? false;
        const execute = () => {
            editorRef.current?.focus();
            applyTextColor(color);
            setCurrentColor(normalizeTextColor(color));
            onColorChange?.();
        };

        if (shouldDefer) {
            window.setTimeout(execute, 0);
            return;
        }

        execute();
    };

    // 切换颜色面板
    const handleToggleOpen = () => {
        syncCurrentColor();
        setOpen((value) => !value);
    };

    // 打开系统取色器
    const handleOpenCustomPicker = () => {
        customColorInputRef.current?.click();
    };

    return (
        <div ref={rootRef} className="relative mx-0.5 shrink-0">
            <button
                type="button"
                aria-label="文字颜色"
                aria-expanded={open}
                aria-haspopup="dialog"
                onMouseDown={handleToolbarMouseDown}
                onClick={handleToggleOpen}
                className={cn(
                    "inline-flex size-5 cursor-pointer rounded-md border border-black/10 transition",
                    isPlain ? "hover:ring-2 hover:ring-slate-200" : "hover:ring-2 hover:ring-white/80",
                )}
                style={{ backgroundColor: currentColor }}
            />

            {open ? (
                <div
                    role="dialog"
                    aria-label="选择文字颜色"
                    className="nodrag nopan absolute left-0 top-full z-50 mt-1.5 w-[188px] rounded-xl border border-black/5 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
                    onMouseDown={(event) => handlePromptPopoverMouseDown(event, "canvas")}
                >
                    <p className="mb-2 text-xs text-slate-400">文字颜色</p>
                    <div className="grid grid-cols-6 gap-1.5">
                        {CANVAS_TEXT_PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                aria-label={`颜色 ${color}`}
                                onMouseDown={handleToolbarMouseDown}
                                onClick={() => {
                                    handleApplyColor(color);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "size-6 cursor-pointer rounded-md border border-black/10 transition hover:scale-105",
                                    currentColor === color ? "ring-2 ring-slate-400 ring-offset-1" : "",
                                )}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        onMouseDown={handleToolbarMouseDown}
                        onClick={handleOpenCustomPicker}
                        className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-lg border border-black/5 px-2.5 py-2 text-xs text-slate-600 transition hover:bg-slate-50"
                    >
                        <span>自定义颜色</span>
                        <span
                            className="size-4 rounded border border-black/10"
                            style={{ backgroundColor: currentColor }}
                        />
                    </button>

                    <input
                        ref={customColorInputRef}
                        type="color"
                        value={currentColor}
                        className="sr-only"
                        onChange={(event) => {
                            handleApplyColor(event.target.value);
                        }}
                    />
                </div>
            ) : null}
        </div>
    );
}
