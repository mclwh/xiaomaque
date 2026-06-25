// 画布撤销/重做键盘快捷键
import { useEffect } from "react";
import { redoCanvas, selectCanRedo, selectCanUndo, undoCanvas } from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type UseCanvasKeyboardShortcutsOptions = {
    containerRef: React.RefObject<HTMLElement | null>;
};

// 绑定 Ctrl/Cmd+Z 撤销与 Ctrl/Cmd+Shift+Z / Ctrl+Y 重做
export function useCanvasKeyboardShortcuts({ containerRef }: UseCanvasKeyboardShortcutsOptions) {
    const dispatch = useAppDispatch();
    const canUndo = useAppSelector(selectCanUndo);
    const canRedo = useAppSelector(selectCanRedo);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        // 处理撤销/重做快捷键
        const handleKeyDown = (event: KeyboardEvent) => {
            const isMod = event.metaKey || event.ctrlKey;

            if (!isMod) {
                return;
            }

            const key = event.key.toLowerCase();

            if (key === "z" && !event.shiftKey && canUndo) {
                event.preventDefault();
                dispatch(undoCanvas());
                return;
            }

            if ((key === "z" && event.shiftKey) || key === "y") {
                if (canRedo) {
                    event.preventDefault();
                    dispatch(redoCanvas());
                }
            }
        };

        container.addEventListener("keydown", handleKeyDown);

        return () => {
            container.removeEventListener("keydown", handleKeyDown);
        };
    }, [canRedo, canUndo, containerRef, dispatch]);
}
