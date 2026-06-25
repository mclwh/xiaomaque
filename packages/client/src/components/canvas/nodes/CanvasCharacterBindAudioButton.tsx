// 角色节点绑定音频触发按钮：按需 lazy 加载弹窗
import { lazy, memo, Suspense, useCallback, useState, type MouseEvent } from "react";
import { AudioLines } from "lucide-react";
import { handlePromptPopoverMouseDown } from "@/components/prompt/promptPopoverUtils";
import { readAssetVoiceAudio } from "@/lib/assetParams";
import { selectCanvasAssetById } from "@/store/canvasSlice";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const LazyCanvasCharacterBindAudioDialog = lazy(() =>
    import("@/components/canvas/nodes/CanvasCharacterBindAudioDialog").then((module) => ({
        default: module.CanvasCharacterBindAudioDialog,
    })),
);

type CanvasCharacterBindAudioButtonProps = {
    characterAssetId: number;
};

// 渲染角色节点绑定音频触发按钮
function CanvasCharacterBindAudioButtonComponent({ characterAssetId }: CanvasCharacterBindAudioButtonProps) {
    const [open, setOpen] = useState(false);
    const characterAsset = useAppSelector((state) =>
        selectCanvasAssetById(state, characterAssetId),
    );
    const isBound = Boolean(readAssetVoiceAudio(characterAsset?.params));

    // 阻止画布拖拽并避免误选中节点
    const handleButtonMouseDown = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        handlePromptPopoverMouseDown(event, "canvas");
    }, []);

    // 打开绑定音频弹窗
    const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        event.preventDefault();
        setOpen(true);
    };

    return (
        <>
            <button
                type="button"
                aria-label={isBound ? "已绑定音频" : "绑定音频"}
                onClick={handleOpen}
                onMouseDown={handleButtonMouseDown}
                onPointerDown={handleButtonMouseDown}
                className={cn(
                    "nodrag nopan inline-flex size-7 cursor-pointer items-center justify-center rounded-md transition",
                    isBound
                        ? "bg-violet-50 text-violet-600 hover:bg-violet-100"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
                )}
            >
                <AudioLines className="size-4" strokeWidth={1.8} />
            </button>
            {open ? (
                <Suspense fallback={null}>
                    <LazyCanvasCharacterBindAudioDialog
                        characterAssetId={characterAssetId}
                        open={open}
                        onClose={() => setOpen(false)}
                    />
                </Suspense>
            ) : null}
        </>
    );
}

export const CanvasCharacterBindAudioButton = memo(CanvasCharacterBindAudioButtonComponent);
