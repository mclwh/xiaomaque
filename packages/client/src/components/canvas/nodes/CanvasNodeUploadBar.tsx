// 节点选中时展示的上传操作条
import { lazy, memo, Suspense, useCallback, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { FolderOpen, Loader2, Upload } from "lucide-react";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import {
    getCanvasNodeMediaConfig,
    isCanvasImageUploadNodeKind,
} from "@/lib/canvasNodeMedia";
import { isValidImageFile } from "@/lib/imageUpload";
import { pushCanvasHistorySnapshot, uploadCanvasImageMedia } from "@/store/canvasSlice";
import { useAppDispatch } from "@/store/hooks";
import { cn } from "@/lib/utils";

const LazyCanvasAssetLibraryPickerDialog = lazy(() =>
    import("@/components/canvas/nodes/CanvasAssetLibraryPickerDialog").then((module) => ({
        default: module.CanvasAssetLibraryPickerDialog,
    })),
);

type CanvasNodeUploadBarProps = {
    assetId: number;
    kind: CanvasNodeKind;
};

// 渲染选中节点的上传与资产库选择操作
function CanvasNodeUploadBarComponent({ assetId, kind }: CanvasNodeUploadBarProps) {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const supportsImageUpload = isCanvasImageUploadNodeKind(kind);
    const mediaConfig = supportsImageUpload ? getCanvasNodeMediaConfig(kind) : null;

    // 阻止事件冒泡到 React Flow
    const stopFlowEvent = useCallback((event: MouseEvent) => {
        event.stopPropagation();
    }, []);

    // 打开本地图片选择器
    const handleUploadClick = () => {
        if (uploading || !supportsImageUpload) {
            return;
        }

        setErrorMessage("");
        fileInputRef.current?.click();
    };

    // 打开资产库选择弹窗
    const handleLibraryClick = () => {
        if (uploading || !supportsImageUpload) {
            return;
        }

        setErrorMessage("");
        setLibraryOpen(true);
    };

    // 处理选中的图片文件
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file || !supportsImageUpload) {
            return;
        }

        if (!isValidImageFile(file)) {
            setErrorMessage("请选择 20MB 以内的图片文件");
            return;
        }

        setUploading(true);
        setErrorMessage("");
        dispatch(pushCanvasHistorySnapshot());

        void dispatch(
            uploadCanvasImageMedia({
                assetId,
                file,
            }),
        )
            .unwrap()
            .catch((error) => {
                setErrorMessage(typeof error === "string" ? error : "图片上传失败");
            })
            .finally(() => {
                setUploading(false);
            });
    };

    if (!supportsImageUpload || !mediaConfig) {
        return null;
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept={mediaConfig.accept}
                className="hidden"
                onChange={handleFileChange}
            />
            <div
                className="nodrag nopan pointer-events-auto flex w-max max-w-none flex-col items-end gap-1 whitespace-nowrap"
                onMouseDown={stopFlowEvent}
                onPointerDown={stopFlowEvent}
            >
                <div className="flex w-max max-w-none flex-row flex-nowrap items-center gap-0 rounded-full border border-black/5 bg-white px-1 py-1 shadow-md">
                    <button
                        type="button"
                        disabled={uploading}
                        onClick={handleUploadClick}
                        className={cn(
                            "inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50",
                            uploading ? "cursor-not-allowed opacity-50" : "",
                        )}
                    >
                        {uploading ? (
                            <Loader2 className="size-3.5 shrink-0 animate-spin" strokeWidth={1.8} />
                        ) : (
                            <Upload className="size-3.5 shrink-0" strokeWidth={1.8} />
                        )}
                        上传
                    </button>
                    <span className="mx-0.5 h-4 w-px shrink-0 bg-slate-200" />
                    <button
                        type="button"
                        disabled={uploading}
                        onClick={handleLibraryClick}
                        className={cn(
                            "inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50",
                            uploading ? "cursor-not-allowed opacity-50" : "",
                        )}
                    >
                        <FolderOpen className="size-3.5 shrink-0" strokeWidth={1.8} />
                        从小麻雀资产库选择
                    </button>
                </div>
                {errorMessage ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs text-red-500 shadow-sm">
                        {errorMessage}
                    </span>
                ) : null}
            </div>
            {libraryOpen ? (
                <Suspense fallback={null}>
                    <LazyCanvasAssetLibraryPickerDialog
                        targetAssetId={assetId}
                        kind={kind}
                        open={libraryOpen}
                        onClose={() => setLibraryOpen(false)}
                    />
                </Suspense>
            ) : null}
        </>
    );
}

export const CanvasNodeUploadBar = memo(CanvasNodeUploadBarComponent);
