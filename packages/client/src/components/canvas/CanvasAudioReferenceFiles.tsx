// 音频节点编辑面板：上传音频并绑定到资产 url
import { lazy, memo, Suspense, useRef, useState, type ChangeEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import {
    getAudioDurationSeconds,
    isValidAudioFileSize,
    shouldTrimAudio,
    trimAudioFileToWav,
    AUDIO_MAX_FILE_SIZE,
} from "@/lib/audioUpload";
import { pushCanvasHistorySnapshot, uploadCanvasAudioMedia } from "@/store/canvasSlice";
import { useAppDispatch } from "@/store/hooks";
import { cn } from "@/lib/utils";

const CanvasAudioTrimDialog = lazy(() =>
    import("@/components/canvas/CanvasAudioTrimDialog").then((module) => ({
        default: module.CanvasAudioTrimDialog,
    })),
);

type CanvasAudioReferenceFilesProps = {
    assetId: number;
    variant?: "upload-button";
};

type PendingTrimFile = {
    file: File;
    durationSeconds: number;
};

// 渲染音频上传按钮
function CanvasAudioReferenceFilesComponent({ assetId, variant = "upload-button" }: CanvasAudioReferenceFilesProps) {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [pendingTrimFile, setPendingTrimFile] = useState<PendingTrimFile | null>(null);

    // 打开文件选择器
    const handleUploadClick = () => {
        if (uploading) {
            return;
        }

        setErrorMessage("");
        fileInputRef.current?.click();
    };

    // 上传 Blob 到七牛并更新资产 url
    const uploadAudioBlob = async (blob: Blob, filename: string) => {
        dispatch(pushCanvasHistorySnapshot());
        await dispatch(
            uploadCanvasAudioMedia({
                assetId,
                file: blob,
                filename,
            }),
        ).unwrap();
    };

    // 处理选中的音频文件
    const processSelectedFile = async (file: File) => {
        if (!isValidAudioFileSize(file.size)) {
            setErrorMessage(`音频文件不能超过 ${Math.floor(AUDIO_MAX_FILE_SIZE / 1024 / 1024)}MB`);
            return;
        }

        setUploading(true);
        setErrorMessage("");

        try {
            const durationSeconds = await getAudioDurationSeconds(file);

            if (shouldTrimAudio(durationSeconds)) {
                setPendingTrimFile({ file, durationSeconds });
                return;
            }

            await uploadAudioBlob(file, file.name);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "音频上传失败");
        } finally {
            setUploading(false);
        }
    };

    // 监听文件选择
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        void processSelectedFile(file);
    };

    // 确认截取后上传
    const handleTrimConfirm = async (range: { start: number; end: number }) => {
        if (!pendingTrimFile) {
            return;
        }

        setUploading(true);
        setErrorMessage("");

        try {
            const trimmedBlob = await trimAudioFileToWav(
                pendingTrimFile.file,
                range.start,
                range.end,
            );
            const baseName = pendingTrimFile.file.name.replace(/\.[^.]+$/, "") || "audio";

            await uploadAudioBlob(trimmedBlob, `${baseName}-trim.wav`);
            setPendingTrimFile(null);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "音频截取失败");
        } finally {
            setUploading(false);
        }
    };

    // 取消截取
    const handleTrimCancel = () => {
        setPendingTrimFile(null);
    };

    if (variant !== "upload-button") {
        return null;
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
            />
            <button
                type="button"
                aria-label="上传音频"
                disabled={uploading}
                onClick={handleUploadClick}
                className={cn(
                    "nodrag inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100",
                    uploading ? "cursor-not-allowed opacity-50" : "",
                )}
            >
                {uploading ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
                ) : (
                    <Plus className="size-4" strokeWidth={1.8} />
                )}
            </button>
            {errorMessage ? (
                <span className="nodrag text-xs text-red-500">{errorMessage}</span>
            ) : null}
            {pendingTrimFile ? (
                <Suspense fallback={null}>
                    <CanvasAudioTrimDialog
                        file={pendingTrimFile.file}
                        durationSeconds={pendingTrimFile.durationSeconds}
                        onCancel={handleTrimCancel}
                        onConfirm={(range) => void handleTrimConfirm(range)}
                    />
                </Suspense>
            ) : null}
        </>
    );
}

export const CanvasAudioReferenceFiles = memo(CanvasAudioReferenceFilesComponent);
