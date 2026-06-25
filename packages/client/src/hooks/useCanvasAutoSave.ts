// 画布自动保存：编辑后防抖触发保存，保存成功后自动隐藏提示
import { useEffect, useRef } from "react";
import {
    AUTO_SAVE_DEBOUNCE_MS,
    SAVE_STATUS_VISIBLE_MS,
    hideSaveStatus,
    saveCanvasLayout,
} from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// 监听画布布局变更，防抖 2 秒后调用保存接口
export function useCanvasAutoSave() {
    const dispatch = useAppDispatch();
    const projectId = useAppSelector((state) => state.canvas.projectId);
    const layoutDirty = useAppSelector((state) => state.canvas.layoutDirty);
    const assetsLoading = useAppSelector((state) => state.canvas.assetsLoading);
    const canvasSaving = useAppSelector((state) => state.canvas.canvasSaving);
    const saveStatusVisible = useAppSelector((state) => state.canvas.saveStatusVisible);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 布局变更后防抖保存
    useEffect(() => {
        if (!projectId || assetsLoading || !layoutDirty || canvasSaving) {
            return;
        }

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(() => {
            void dispatch(saveCanvasLayout());
        }, AUTO_SAVE_DEBOUNCE_MS);

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, [assetsLoading, canvasSaving, dispatch, layoutDirty, projectId]);

    // 保存成功后展示「已保存」2 秒后隐藏
    useEffect(() => {
        if (!saveStatusVisible) {
            return;
        }

        if (statusTimerRef.current) {
            clearTimeout(statusTimerRef.current);
        }

        statusTimerRef.current = setTimeout(() => {
            dispatch(hideSaveStatus());
        }, SAVE_STATUS_VISIBLE_MS);

        return () => {
            if (statusTimerRef.current) {
                clearTimeout(statusTimerRef.current);
            }
        };
    }, [dispatch, saveStatusVisible]);
}
