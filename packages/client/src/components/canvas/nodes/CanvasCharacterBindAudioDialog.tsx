// 角色节点绑定音频弹窗：展示已绑定音频，支持更换、添加与解除绑定
import { memo, useCallback, useEffect, useMemo, useState, type MouseEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { AudioLines, Check, Loader2 } from "lucide-react";
import { MediaAudioPlayer } from "@/components/ui/media-audio-player";
import { resolveAudioAssetLabel } from "@/lib/assetDisplay";
import { readAssetVoiceAudio } from "@/lib/assetParams";
import { resolveStorageUrl } from "@/lib/storageUrl";
import {
    bindAudioToCharacters,
    pushCanvasHistorySnapshot,
    selectBindableAudioAssets,
    selectCanvasAssetById,
    unbindCharacterVoiceAudio,
} from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

type CanvasCharacterBindAudioDialogProps = {
    characterAssetId: number;
    open: boolean;
    onClose: () => void;
};

// 渲染角色绑定音频弹窗
function CanvasCharacterBindAudioDialogComponent({
    characterAssetId,
    open,
    onClose,
}: CanvasCharacterBindAudioDialogProps) {
    const dispatch = useAppDispatch();
    const characterAsset = useAppSelector((state) =>
        selectCanvasAssetById(state, characterAssetId),
    );
    const audioAssets = useAppSelector(selectBindableAudioAssets);
    const [selectedAudioAssetId, setSelectedAudioAssetId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const voiceAudio = useMemo(
        () => readAssetVoiceAudio(characterAsset?.params),
        [characterAsset?.params],
    );
    const boundAudioAsset = useMemo(
        () =>
            voiceAudio
                ? audioAssets.find((asset) => asset.id === voiceAudio.sourceAssetId) ?? null
                : null,
        [audioAssets, voiceAudio],
    );

    // 打开弹窗时同步默认选中项
    useEffect(() => {
        setErrorMessage("");
        setSelectedAudioAssetId(voiceAudio?.sourceAssetId ?? audioAssets[0]?.id ?? null);
    }, [audioAssets, voiceAudio?.sourceAssetId]);

    // 阻止事件冒泡到 React Flow
    const stopFlowEvent = useCallback((event: MouseEvent | PointerEvent) => {
        event.stopPropagation();
    }, []);

    // 确认绑定选中的音频
    const handleConfirmBind = useCallback(async () => {
        if (!selectedAudioAssetId || isSubmitting) {
            return;
        }

        if (voiceAudio?.sourceAssetId === selectedAudioAssetId) {
            onClose();
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            dispatch(pushCanvasHistorySnapshot());
            await dispatch(
                bindAudioToCharacters({
                    audioAssetId: selectedAudioAssetId,
                    characterAssetIds: [characterAssetId],
                    bindMode: "single",
                }),
            ).unwrap();
            onClose();
        } catch (error) {
            setErrorMessage(typeof error === "string" ? error : "绑定音频失败");
        } finally {
            setIsSubmitting(false);
        }
    }, [characterAssetId, dispatch, isSubmitting, onClose, selectedAudioAssetId, voiceAudio?.sourceAssetId]);

    // 解除当前绑定
    const handleUnbind = useCallback(async () => {
        if (!voiceAudio || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            dispatch(pushCanvasHistorySnapshot());
            await dispatch(unbindCharacterVoiceAudio(characterAssetId)).unwrap();
            onClose();
        } catch (error) {
            setErrorMessage(typeof error === "string" ? error : "解除绑定失败");
        } finally {
            setIsSubmitting(false);
        }
    }, [characterAssetId, dispatch, isSubmitting, onClose, voiceAudio]);

    if (!open) {
        return null;
    }

    const dialogContent = (
        <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 p-4"
            onPointerDown={stopFlowEvent}
        >
            <div
                className="nodrag nopan flex w-full max-w-[480px] flex-col rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
                onPointerDown={stopFlowEvent}
            >
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">绑定音频</h3>
                    <p className="mt-1 text-sm text-slate-500">为角色选择音色音频，可在下方更换或添加</p>
                </div>

                {boundAudioAsset ? (
                    <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-emerald-700">当前绑定</p>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                    void handleUnbind();
                                }}
                                className="cursor-pointer text-xs text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                解除绑定
                            </button>
                        </div>
                        <p className="mb-2 truncate text-sm font-medium text-slate-900">
                            {resolveAudioAssetLabel(boundAudioAsset)}
                        </p>
                        {resolveStorageUrl(boundAudioAsset.url) ? (
                            <MediaAudioPlayer
                                src={resolveStorageUrl(boundAudioAsset.url)!}
                                className="rounded-xl bg-white/80 px-2 py-1"
                            />
                        ) : null}
                    </div>
                ) : null}

                <div className="min-h-0 flex-1">
                    <p className="mb-2 text-xs font-medium text-slate-500">
                        {boundAudioAsset ? "更换为其他音频" : "选择音频"}
                    </p>
                    <div className="nowheel max-h-[240px] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/80 p-2">
                        {audioAssets.length === 0 ? (
                            <p className="px-2 py-6 text-center text-sm text-slate-400">
                                画布中暂无可用音频，请先创建音频节点并上传
                            </p>
                        ) : (
                            audioAssets.map((asset) => {
                                const selected = selectedAudioAssetId === asset.id;
                                const isCurrentBound = voiceAudio?.sourceAssetId === asset.id;

                                return (
                                    <button
                                        key={asset.id}
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setSelectedAudioAssetId(asset.id)}
                                        className={cn(
                                            "mb-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition last:mb-0",
                                            selected
                                                ? "bg-white shadow-sm ring-1 ring-violet-200"
                                                : "hover:bg-white/70",
                                            isSubmitting ? "cursor-not-allowed opacity-60" : "",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                                                selected ? "bg-violet-100 text-violet-600" : "bg-slate-200 text-slate-500",
                                            )}
                                        >
                                            <AudioLines className="size-4" strokeWidth={1.8} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-slate-900">
                                                {resolveAudioAssetLabel(asset)}
                                            </span>
                                            {isCurrentBound ? (
                                                <span className="text-xs text-emerald-600">当前绑定</span>
                                            ) : null}
                                        </span>
                                        {selected ? (
                                            <Check className="size-4 shrink-0 text-violet-600" strokeWidth={2.5} />
                                        ) : null}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {errorMessage ? (
                    <p className="mt-3 text-center text-xs text-red-500">{errorMessage}</p>
                ) : null}

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="inline-flex h-9 cursor-pointer items-center rounded-full px-4 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting || !selectedAudioAssetId || audioAssets.length === 0}
                        onClick={() => {
                            void handleConfirmBind();
                        }}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-4 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : null}
                        {boundAudioAsset ? "确认更换" : "确认绑定"}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(dialogContent, document.body);
}

export const CanvasCharacterBindAudioDialog = memo(CanvasCharacterBindAudioDialogComponent);
