// 画布全局图片预览：单例挂载，避免每个节点重复实例化预览组件
import { lazy, Suspense, useCallback } from "react";
import { closeMediaImagePreview, selectMediaImagePreview } from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// LazyMediaImagePreview 按需加载预览组件，减少节点 bundle 引用
const LazyMediaImagePreview = lazy(() =>
    import("@/components/ui/media-image-preview").then((module) => ({
        default: module.MediaImagePreview,
    })),
);

// 渲染画布级单例图片预览
export function CanvasMediaImagePreview() {
    const dispatch = useAppDispatch();
    const preview = useAppSelector(selectMediaImagePreview);

    // 关闭预览（dispatch 引用稳定，可安全作为 onClose）
    const handleClose = useCallback(() => {
        dispatch(closeMediaImagePreview());
    }, [dispatch]);

    if (!preview) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <LazyMediaImagePreview
                open
                src={preview.src}
                alt={preview.alt}
                onClose={handleClose}
            />
        </Suspense>
    );
}
