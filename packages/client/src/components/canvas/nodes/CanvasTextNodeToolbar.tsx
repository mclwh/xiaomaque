// 文本节点选中时展示的富文本编辑工具栏
import { useCallback, useEffect, useState, type MouseEvent, type RefObject } from "react";
import { Maximize2 } from "lucide-react";
import { CanvasTextNodeColorPicker } from "@/components/canvas/nodes/CanvasTextNodeColorPicker";
import {
    applyTextBlockLevel,
    clearTextFormatting,
    queryTextBlockLevel,
    queryTextFormatState,
    toggleTextFormat,
    type TextBlockLevel,
    type TextFormatCommand,
} from "@/lib/canvasTextEditor";
import { cn } from "@/lib/utils";

type CanvasTextNodeToolbarProps = {
    editorRef: RefObject<HTMLDivElement | null>;
    onExpand?: () => void;
    onBeforeCommand?: () => boolean;
    variant?: "floating" | "plain";
};

type ToolbarFormatState = {
    blockLevel: TextBlockLevel;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikeThrough: boolean;
};

// 读取当前编辑器选区格式状态
function readFormatState(): ToolbarFormatState {
    return {
        blockLevel: queryTextBlockLevel(),
        bold: queryTextFormatState("bold"),
        italic: queryTextFormatState("italic"),
        underline: queryTextFormatState("underline"),
        strikeThrough: queryTextFormatState("strikeThrough"),
    };
}

// 渲染文本节点专属格式化工具栏
export function CanvasTextNodeToolbar({
    editorRef,
    onExpand,
    onBeforeCommand,
    variant = "floating",
}: CanvasTextNodeToolbarProps) {
    const isPlain = variant === "plain";
    const [formatState, setFormatState] = useState<ToolbarFormatState>(readFormatState);

    // 同步编辑器选区变化到工具栏状态
    const syncFormatState = useCallback(() => {
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

        setFormatState(readFormatState());
    }, [editorRef]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        editor.addEventListener("keyup", syncFormatState);
        editor.addEventListener("mouseup", syncFormatState);
        editor.addEventListener("focus", syncFormatState);
        document.addEventListener("selectionchange", syncFormatState);

        return () => {
            editor.removeEventListener("keyup", syncFormatState);
            editor.removeEventListener("mouseup", syncFormatState);
            editor.removeEventListener("focus", syncFormatState);
            document.removeEventListener("selectionchange", syncFormatState);
        };
    }, [editorRef, syncFormatState]);

    // 阻止失焦后执行格式化命令
    const handleToolbarMouseDown = (event: MouseEvent) => {
        event.preventDefault();
    };

    // 聚焦编辑器并执行命令
    const runCommand = (command: () => void) => {
        const shouldDefer = onBeforeCommand?.() ?? false;
        const execute = () => {
            editorRef.current?.focus();
            command();
            syncFormatState();
        };

        if (shouldDefer) {
            window.setTimeout(execute, 0);
            return;
        }

        execute();
    };

    return (
        <div
            className={cn(
                "nodrag nopan pointer-events-auto flex items-center gap-0.5",
                isPlain
                    ? ""
                    : "rounded-full border border-black/5 bg-[#f3f4f6] px-1.5 py-1 shadow-sm",
            )}
        >
            <CanvasTextNodeColorPicker
                editorRef={editorRef}
                isPlain={isPlain}
                onBeforeCommand={onBeforeCommand}
                onColorChange={syncFormatState}
            />

            {(["h1", "h2", "h3"] as const).map((level) => (
                <button
                    key={level}
                    type="button"
                    aria-label={level.toUpperCase()}
                    onMouseDown={handleToolbarMouseDown}
                    onClick={() => runCommand(() => applyTextBlockLevel(level))}
                    className={cn(
                        "inline-flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md px-1.5 text-xs font-medium text-slate-600 transition",
                        isPlain ? "hover:bg-slate-100" : "hover:bg-white/80",
                        formatState.blockLevel === level
                            ? isPlain
                                ? "bg-slate-100 text-slate-900"
                                : "bg-white text-slate-900 shadow-sm"
                            : "",
                    )}
                >
                    {level.toUpperCase()}
                </button>
            ))}

            {(
                [
                    { id: "bold" as TextFormatCommand, label: "B", className: "font-bold" },
                    { id: "italic" as TextFormatCommand, label: "I", className: "italic" },
                    { id: "underline" as TextFormatCommand, label: "U", className: "underline" },
                    {
                        id: "strikeThrough" as TextFormatCommand,
                        label: "S",
                        className: "line-through",
                    },
                ] as const
            ).map((item) => (
                <button
                    key={item.id}
                    type="button"
                    aria-label={item.id}
                    onMouseDown={handleToolbarMouseDown}
                    onClick={() => runCommand(() => toggleTextFormat(item.id))}
                    className={cn(
                        "inline-flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md px-1.5 text-xs text-slate-600 transition",
                        item.className,
                        isPlain ? "hover:bg-slate-100" : "hover:bg-white/80",
                        formatState[item.id]
                            ? isPlain
                                ? "bg-slate-100 text-slate-900"
                                : "bg-white text-slate-900 shadow-sm"
                            : "",
                    )}
                >
                    {item.label}
                </button>
            ))}

            <button
                type="button"
                onMouseDown={handleToolbarMouseDown}
                onClick={() => runCommand(clearTextFormatting)}
                className={cn(
                    "inline-flex h-7 cursor-pointer items-center justify-center rounded-md px-2 text-xs text-slate-600 transition",
                    isPlain ? "hover:bg-slate-100" : "hover:bg-white/80",
                )}
            >
                Clear
            </button>

            {!isPlain ? (
                <>
                    <span className="mx-0.5 h-4 w-px shrink-0 bg-slate-300" />

                    <button
                        type="button"
                        aria-label="展开"
                        onMouseDown={handleToolbarMouseDown}
                        onClick={() => onExpand?.()}
                        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-slate-500 transition hover:bg-white/80 hover:text-slate-700"
                    >
                        <Maximize2 className="size-3.5" strokeWidth={1.8} />
                    </button>
                </>
            ) : null}
        </div>
    );
}
