// 音频节点顶部操作条：绑定角色、入库、下载（节点已设置音频时展示）
import { memo, useCallback, useState, type MouseEvent } from "react";
import { Download, FolderPlus, Loader2 } from "lucide-react";
import { CanvasAudioBindCharacterPopover } from "@/components/canvas/nodes/CanvasAudioBindCharacterPopover";
import { resolveStorageUrl } from "@/lib/storageUrl";
import { markCanvasAssetAsMaterial, selectCanvasAssetById } from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

type CanvasAudioNodeToolbarProps = {
    assetId: number;
    mediaUrl: string;
};

// 渲染音频节点顶部操作条
function CanvasAudioNodeToolbarComponent({ assetId, mediaUrl }: CanvasAudioNodeToolbarProps) {
    const dispatch = useAppDispatch();
    const assetType = useAppSelector((state) => selectCanvasAssetById(state, assetId)?.type);
    const [isSaving, setIsSaving] = useState(false);

    // isMaterial 是否已归入素材库
    const isMaterial = assetType === "material";

    // 阻止事件冒泡到 React Flow
    const stopFlowEvent = useCallback((event: MouseEvent) => {
        event.stopPropagation();
    }, []);

    // 下载当前节点音频
    const handleDownload = useCallback(() => {
        const url = resolveStorageUrl(mediaUrl);

        if (!url) {
            return;
        }

        const link = document.createElement("a");
        link.href = url;
        link.download = "";
        link.rel = "noopener noreferrer";
        link.target = "_blank";
        link.click();
    }, [mediaUrl]);

    // 将当前资产 type 设为 material 并保存到素材库
    const handleSaveToMaterial = useCallback(async () => {
        if (isMaterial || isSaving) {
            return;
        }

        setIsSaving(true);

        try {
            await dispatch(markCanvasAssetAsMaterial(assetId)).unwrap();
        } finally {
            setIsSaving(false);
        }
    }, [assetId, dispatch, isMaterial, isSaving]);

    return (
        <div
            className="nodrag nopan pointer-events-auto flex w-max max-w-none flex-row flex-nowrap items-center gap-0 whitespace-nowrap rounded-full border border-black/5 bg-white px-1 py-1 shadow-md"
            onMouseDown={stopFlowEvent}
            onPointerDown={stopFlowEvent}
        >
            <CanvasAudioBindCharacterPopover audioAssetId={assetId} />

            <span className="mx-0.5 h-4 w-px shrink-0 bg-slate-200" />

            <button
                type="button"
                aria-label={isMaterial ? "已保存到素材库" : "保存到资产库"}
                disabled={isMaterial || isSaving}
                onClick={() => {
                    void handleSaveToMaterial();
                }}
                className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-slate-700 transition",
                    isMaterial || isSaving
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:bg-slate-50",
                )}
            >
                {isSaving ? (
                    <Loader2 className="size-3.5 animate-spin" strokeWidth={1.8} />
                ) : (
                    <FolderPlus className="size-3.5" strokeWidth={1.8} />
                )}
            </button>

            <button
                type="button"
                aria-label="下载音频"
                onClick={handleDownload}
                className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-50"
            >
                <Download className="size-3.5" strokeWidth={1.8} />
            </button>
        </div>
    );
}

export const CanvasAudioNodeToolbar = memo(CanvasAudioNodeToolbarComponent);
