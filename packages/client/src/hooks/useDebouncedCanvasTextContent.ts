// 文本节点内容 debounce 写入 Redux，flush 前压入撤销快照
import { useCallback, useEffect, useRef } from "react";
import { pushCanvasHistorySnapshot, updateCanvasNodeTextContent } from "@/store/canvasSlice";
import { useAppDispatch } from "@/store/hooks";

// TEXT_CONTENT_DEBOUNCE_MS 文本内容写入防抖延迟
const TEXT_CONTENT_DEBOUNCE_MS = 300;

type UseDebouncedCanvasTextContentOptions = {
    nodeId: string;
};

type UseDebouncedCanvasTextContentResult = {
    persistContent: (textContent: string) => void;
    flushContent: (textContent: string) => void;
};

// 提供 debounce 与立即 flush 的文本内容持久化
export function useDebouncedCanvasTextContent({
    nodeId,
}: UseDebouncedCanvasTextContentOptions): UseDebouncedCanvasTextContentResult {
    const dispatch = useAppDispatch();
    // debounceTimerRef 防抖定时器
    const debounceTimerRef = useRef<number | null>(null);
    // hasPendingHistoryRef 是否已为当前编辑批次压入撤销快照
    const hasPendingHistoryRef = useRef(false);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current !== null) {
                window.clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // 写入 Redux 并在首次 debounce 前压入撤销快照
    const writeContent = useCallback(
        (textContent: string, immediate: boolean) => {
            if (!hasPendingHistoryRef.current) {
                dispatch(pushCanvasHistorySnapshot());
                hasPendingHistoryRef.current = true;
            }

            dispatch(updateCanvasNodeTextContent({ nodeId, textContent }));

            if (immediate) {
                hasPendingHistoryRef.current = false;
            }
        },
        [dispatch, nodeId],
    );

    // debounce 持久化文本内容
    const persistContent = useCallback(
        (textContent: string) => {
            if (debounceTimerRef.current !== null) {
                window.clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = window.setTimeout(() => {
                writeContent(textContent, false);
                hasPendingHistoryRef.current = false;
                debounceTimerRef.current = null;
            }, TEXT_CONTENT_DEBOUNCE_MS);
        },
        [writeContent],
    );

    // 立即 flush 文本内容（失焦或关闭弹窗时）
    const flushContent = useCallback(
        (textContent: string) => {
            if (debounceTimerRef.current !== null) {
                window.clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }

            writeContent(textContent, true);
        },
        [writeContent],
    );

    return { persistContent, flushContent };
}
