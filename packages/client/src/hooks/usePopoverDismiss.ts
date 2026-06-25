// 点击弹层外部时触发关闭
import { useEffect, type RefObject } from "react";

// 监听 document 点击，在弹层外部按下时执行回调
export function usePopoverDismiss(
    rootRef: RefObject<HTMLElement | null>,
    open: boolean,
    onDismiss: () => void,
    extraRefs?: RefObject<HTMLElement | null>[],
) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            const inRoot = rootRef.current?.contains(target);
            const inExtra = extraRefs?.some((ref) => ref.current?.contains(target));

            if (!inRoot && !inExtra) {
                onDismiss();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [extraRefs, onDismiss, open, rootRef]);
}
