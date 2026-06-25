// 文本节点放大编辑弹窗
import { useCallback, useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { CANVAS_NODE_UI } from "@/components/canvas/canvasNodeConfig";
import { CanvasTextNodeToolbar } from "@/components/canvas/nodes/CanvasTextNodeToolbar";
import { readEditorHtml, writeEditorHtml } from "@/lib/canvasTextEditor";
import { cn } from "@/lib/utils";

// CANVAS_TEXT_EXPAND_MODAL_WIDTH 弹窗宽度
const CANVAS_TEXT_EXPAND_MODAL_WIDTH = 1180;

// CANVAS_TEXT_EXPAND_MODAL_HEIGHT 弹窗高度
const CANVAS_TEXT_EXPAND_MODAL_HEIGHT = 640;

// CANVAS_TEXT_EXPAND_MODAL_PADDING 弹窗内边距
const CANVAS_TEXT_EXPAND_MODAL_PADDING = 28;

type CanvasTextNodeExpandModalProps = {
    open: boolean;
    initialContent: string;
    onClose: (content: string) => void;
};

// 渲染文本节点全屏放大编辑弹窗
export function CanvasTextNodeExpandModal({
    open,
    initialContent,
    onClose,
}: CanvasTextNodeExpandModalProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const config = CANVAS_NODE_UI.text;

    // 打开弹窗时写入初始内容并聚焦
    useEffect(() => {
        if (!open || !editorRef.current) {
            return;
        }

        writeEditorHtml(editorRef.current, initialContent);
        editorRef.current.focus();
    }, [initialContent, open]);

    // 关闭弹窗并回传最新内容
    const handleClose = useCallback(() => {
        onClose(readEditorHtml(editorRef.current));
    }, [onClose]);

    // 监听 Esc 关闭弹窗
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                handleClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleClose, open]);

    // 阻止冒泡，避免触发画布交互
    const handleSurfaceMouseDown = (event: MouseEvent) => {
        event.stopPropagation();
    };

    // 阻止 Delete 等快捷键被画布捕获
    const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    if (!open) {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-6"
            onMouseDown={handleSurfaceMouseDown}
        >
            <div
                role="dialog"
                aria-modal
                aria-label="放大编辑文本"
                className="relative flex max-h-[calc(100vh-48px)] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]"
                style={{
                    width: CANVAS_TEXT_EXPAND_MODAL_WIDTH,
                    height: CANVAS_TEXT_EXPAND_MODAL_HEIGHT,
                    padding: CANVAS_TEXT_EXPAND_MODAL_PADDING,
                }}
                onMouseDown={handleSurfaceMouseDown}
            >
                <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
                    <CanvasTextNodeToolbar editorRef={editorRef} variant="plain" />
                    <button
                        type="button"
                        aria-label="关闭"
                        onClick={handleClose}
                        className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-black/5 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    >
                        <X className="size-4" strokeWidth={1.8} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        role="textbox"
                        aria-multiline
                        aria-label="文本内容"
                        data-placeholder={config.placeholderText}
                        className={cn(
                            "min-h-full text-base leading-7 text-slate-900 outline-none",
                            "empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)]",
                            "[&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold",
                        )}
                        onKeyDown={handleEditorKeyDown}
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
}
