// 画布节点资产库选择弹窗：按节点类型筛选可应用的图片资产
import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { resolveAssetLabel } from "@/lib/assetDisplay";
import {
    filterAssetsByLibraryTab,
    getCanvasNodeMediaConfig,
    resolveAssetLibraryPreviewKey,
    type CanvasLibraryTabKey,
    type CanvasNodeMediaKind,
} from "@/lib/canvasNodeMedia";
import { resolveStoragePreviewUrl } from "@/lib/storageUrl";
import { applyCanvasLibraryMedia, pushCanvasHistorySnapshot, selectCanvasAssetsList } from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

type CanvasAssetLibraryPickerDialogProps = {
    targetAssetId: number;
    kind: CanvasNodeMediaKind;
    open: boolean;
    onClose: () => void;
};

// 渲染画布资产库选择弹窗
function CanvasAssetLibraryPickerDialogComponent({
    targetAssetId,
    kind,
    open,
    onClose,
}: CanvasAssetLibraryPickerDialogProps) {
    const dispatch = useAppDispatch();
    const assets = useAppSelector(selectCanvasAssetsList);
    const mediaConfig = getCanvasNodeMediaConfig(kind);
    const defaultTab = mediaConfig.libraryTabs[0]?.key ?? "material";
    const wasOpenRef = useRef(false);
    const [activeTab, setActiveTab] = useState<CanvasLibraryTabKey>(defaultTab);
    const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const tabAssets = useMemo(
        () => filterAssetsByLibraryTab(assets, activeTab, targetAssetId),
        [activeTab, assets, targetAssetId],
    );

    // 打开弹窗时重置 Tab 与选中项；Tab 切换时清空选中项
    useEffect(() => {
        if (!open) {
            wasOpenRef.current = false;
            return;
        }

        if (!wasOpenRef.current) {
            setActiveTab(defaultTab);
            setSelectedAssetId(null);
            setErrorMessage("");
        } else {
            setSelectedAssetId(null);
        }

        wasOpenRef.current = true;
    }, [activeTab, defaultTab, open]);

    // 阻止事件冒泡到 React Flow
    const stopFlowEvent = useCallback((event: MouseEvent | PointerEvent) => {
        event.stopPropagation();
    }, []);

    // 确认应用所选资产图片
    const handleConfirm = useCallback(async () => {
        if (!selectedAssetId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            dispatch(pushCanvasHistorySnapshot());
            await dispatch(
                applyCanvasLibraryMedia({
                    targetAssetId,
                    sourceAssetId: selectedAssetId,
                }),
            ).unwrap();
            onClose();
        } catch (error) {
            setErrorMessage(typeof error === "string" ? error : "应用资产失败");
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, isSubmitting, onClose, selectedAssetId, targetAssetId]);

    if (!open) {
        return null;
    }

    const dialogContent = (
        <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 p-4"
            onPointerDown={stopFlowEvent}
        >
            <div
                className="nodrag nopan flex max-h-[80vh] w-full max-w-[560px] flex-col rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
                onPointerDown={stopFlowEvent}
            >
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">从小麻雀资产库选择</h3>
                    <p className="mt-1 text-sm text-slate-500">已按当前节点类型筛选可使用的图片资产</p>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                    {mediaConfig.libraryTabs.map((tab) => {
                        const selected = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    "inline-flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs transition",
                                    selected
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="nowheel min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/80 p-2">
                    {tabAssets.length === 0 ? (
                        <p className="px-2 py-8 text-center text-sm text-slate-400">
                            当前分类下暂无可用图片
                        </p>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {tabAssets.map((asset) => {
                                const selected = selectedAssetId === asset.id;
                                const previewUrl = resolveStoragePreviewUrl(resolveAssetLibraryPreviewKey(asset));

                                return (
                                    <button
                                        key={asset.id}
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setSelectedAssetId(asset.id)}
                                        className={cn(
                                            "relative overflow-hidden rounded-xl border bg-white text-left transition",
                                            selected
                                                ? "border-violet-400 ring-2 ring-violet-200"
                                                : "border-slate-200 hover:border-slate-300",
                                            isSubmitting ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                                        )}
                                    >
                                        <div className="aspect-[4/5] bg-[#f0f0f2]">
                                            {previewUrl ? (
                                                <img
                                                    src={previewUrl}
                                                    alt={resolveAssetLabel(asset)}
                                                    className="size-full object-cover"
                                                    draggable={false}
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center">
                                                    <ImageIcon className="size-6 text-slate-300" strokeWidth={1.5} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-2 py-1.5">
                                            <p className="truncate text-xs font-medium text-slate-900">
                                                {resolveAssetLabel(asset)}
                                            </p>
                                        </div>
                                        {selected ? (
                                            <span className="absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-full bg-violet-600 text-white">
                                                <Check className="size-3" strokeWidth={2.5} />
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    )}
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
                        disabled={isSubmitting || !selectedAssetId}
                        onClick={() => {
                            void handleConfirm();
                        }}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-4 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : null}
                        确认使用
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(dialogContent, document.body);
}

export const CanvasAssetLibraryPickerDialog = memo(CanvasAssetLibraryPickerDialogComponent);
