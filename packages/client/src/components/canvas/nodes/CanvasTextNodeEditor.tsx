// 文本节点内联富文本编辑区
import {
    memo,
    useCallback,
    useEffect,
    useRef,
    useState,
    type FocusEvent,
    type KeyboardEvent,
    type MouseEvent,
} from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import { CANVAS_NODE_UI } from "@/components/canvas/canvasNodeConfig";
import { CanvasTextNodeExpandModal } from "@/components/canvas/nodes/CanvasTextNodeExpandModal";
import { CanvasTextNodeToolbar } from "@/components/canvas/nodes/CanvasTextNodeToolbar";
import { useDebouncedCanvasTextContent } from "@/hooks/useDebouncedCanvasTextContent";
import { readEditorHtml } from "@/lib/canvasTextEditor";
import { cn } from "@/lib/utils";

type CanvasTextNodeEditorProps = {
    nodeId: string;
    selected: boolean;
    textContent: string;
};

// 渲染文本节点可编辑内容与工具栏
function CanvasTextNodeEditorComponent({ nodeId, selected, textContent }: CanvasTextNodeEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const wasSelectedRef = useRef(false);
    const [isEditing, setIsEditing] = useState(false);
    const [expandOpen, setExpandOpen] = useState(false);
    const [expandInitialContent, setExpandInitialContent] = useState("");
    const { persistContent, flushContent } = useDebouncedCanvasTextContent({ nodeId });
    const config = CANVAS_NODE_UI.text;
    const isEmpty = !textContent || textContent === "<br>";

    // 记录上一轮渲染时的选中状态，用于区分「首次选中」与「再次点击」
    useEffect(() => {
        wasSelectedRef.current = selected;
    }, [selected]);

    // 取消选中时退出编辑态
    useEffect(() => {
        if (!selected) {
            setIsEditing(false);
        }
    }, [selected]);

    // 进入编辑态后聚焦编辑区
    useEffect(() => {
        if (!isEditing || !editorRef.current || expandOpen) {
            return;
        }

        editorRef.current.focus();
    }, [expandOpen, isEditing]);

    // 初始化编辑器内容
    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        editorRef.current.innerHTML = textContent;
    }, [nodeId]);

    // 编辑区失焦时保存并退出编辑态
    const handleBlur = (_event: FocusEvent<HTMLDivElement>) => {
        if (expandOpen) {
            return;
        }

        flushContent(readEditorHtml(editorRef.current));
        setIsEditing(false);
    };

    // 已选中节点再次点击时进入编辑态
    const handleEditorClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!selected || isEditing || expandOpen) {
            return;
        }

        if (!wasSelectedRef.current) {
            return;
        }

        event.stopPropagation();
        setIsEditing(true);
    };

    // 编辑态下阻止冒泡，避免干扰画布；未编辑时允许拖动节点
    const handleEditorMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        if (isEditing) {
            event.stopPropagation();
        }
    };

    // 编辑态下阻止快捷键被画布捕获
    const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (isEditing) {
            event.stopPropagation();
        }
    };

    // 打开放大编辑弹窗
    const handleExpand = () => {
        setExpandInitialContent(readEditorHtml(editorRef.current) || textContent);
        setExpandOpen(true);
    };

    // 关闭放大弹窗并同步内容
    const handleExpandClose = (content: string) => {
        if (editorRef.current) {
            editorRef.current.innerHTML = content;
        }

        flushContent(content);
        setExpandOpen(false);
    };

    // 工具栏操作前若未在编辑态则先进入编辑态
    const handleBeforeCommand = useCallback(() => {
        if (isEditing) {
            return false;
        }

        setIsEditing(true);
        return true;
    }, [isEditing]);

    return (
        <>
            <div className="relative">
                {selected && !expandOpen ? (
                    <NodeToolbar nodeId={nodeId} position={Position.Top} align="center" offset={10}>
                        <CanvasTextNodeToolbar
                            editorRef={editorRef}
                            onExpand={handleExpand}
                            onBeforeCommand={handleBeforeCommand}
                        />
                    </NodeToolbar>
                ) : null}

                <div
                    className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-sm"
                    style={{ width: config.cardWidth, minHeight: config.cardMinHeight }}
                >
                    <div
                        ref={editorRef}
                        contentEditable={isEditing && !expandOpen}
                        suppressContentEditableWarning
                        role="textbox"
                        aria-multiline
                        aria-label="文本内容"
                        data-placeholder={config.placeholderText}
                        className={cn(
                            "min-h-[120px] px-4 py-4 text-sm leading-6 text-slate-900 outline-none",
                            "empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)]",
                            "[&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold",
                            isEditing ? "nodrag nopan cursor-text" : "cursor-default",
                            !selected && isEmpty ? "text-slate-300" : "",
                        )}
                        onClick={handleEditorClick}
                        onBlur={handleBlur}
                        onInput={() => persistContent(readEditorHtml(editorRef.current))}
                        onMouseDown={handleEditorMouseDown}
                        onKeyDown={handleEditorKeyDown}
                    />
                </div>
            </div>

            <CanvasTextNodeExpandModal
                open={expandOpen}
                initialContent={expandInitialContent}
                onClose={handleExpandClose}
            />
        </>
    );
}

export const CanvasTextNodeEditor = memo(CanvasTextNodeEditorComponent);
