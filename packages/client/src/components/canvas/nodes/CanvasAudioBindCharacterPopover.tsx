// 音频节点绑定角色弹层：树形多选后确认绑定
import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Check, ChevronDown, Loader2, UserRound } from "lucide-react";
import { CanvasAudioBindCharacterTree } from "@/components/canvas/nodes/CanvasAudioBindCharacterTree";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { buildCharacterBindingGroups } from "@/lib/audioCharacterBinding";
import {
    buildDefaultExpandedGroupKeys,
    resolveCharacterBindingSubmit,
} from "@/lib/audioCharacterBindingSelection";
import { readAssetAudioCharacterBinding } from "@/lib/assetParams";
import { bindAudioToCharacters, pushCanvasHistorySnapshot, selectCanvasAssetById, selectCanvasAssetsList } from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

type CanvasAudioBindCharacterPopoverProps = {
    audioAssetId: number;
};

// 渲染音频节点绑定角色弹层
function CanvasAudioBindCharacterPopoverComponent({ audioAssetId }: CanvasAudioBindCharacterPopoverProps) {
    const dispatch = useAppDispatch();
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [isBinding, setIsBinding] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
    const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string>>(() => new Set());

    const assets = useAppSelector(selectCanvasAssetsList);
    const audioAsset = useAppSelector((state) => selectCanvasAssetById(state, audioAssetId));

    const characterGroups = useMemo(() => buildCharacterBindingGroups(assets), [assets]);
    const existingBinding = useMemo(
        () => readAssetAudioCharacterBinding(audioAsset?.params),
        [audioAsset?.params],
    );

    usePopoverDismiss(rootRef, open, () => setOpen(false));

    // 打开弹层时恢复已绑定选中项，并默认展开多形象分组
    useEffect(() => {
        if (!open) {
            return;
        }

        setSelectedIds(new Set(existingBinding?.characterAssetIds ?? []));
        setExpandedGroupKeys(buildDefaultExpandedGroupKeys(characterGroups));
    }, [characterGroups, existingBinding, open]);

    // 阻止事件冒泡到 React Flow
    const stopFlowEvent = useCallback((event: MouseEvent) => {
        event.stopPropagation();
    }, []);

    // 切换弹层开关
    const handleToggleOpen = useCallback(() => {
        setOpen((current) => !current);
    }, []);

    // 确认绑定当前选中的角色
    const handleConfirmBind = useCallback(async () => {
        if (isBinding || selectedIds.size === 0) {
            return;
        }

        setIsBinding(true);

        try {
            const selectedIdList = [...selectedIds];
            const submitPayload = resolveCharacterBindingSubmit(selectedIdList, characterGroups);

            dispatch(pushCanvasHistorySnapshot());
            await dispatch(
                bindAudioToCharacters({
                    audioAssetId,
                    characterAssetIds: submitPayload.characterAssetIds,
                    bindMode: submitPayload.bindMode,
                    deriveId: submitPayload.deriveId,
                }),
            ).unwrap();
            setOpen(false);
        } finally {
            setIsBinding(false);
        }
    }, [audioAssetId, characterGroups, dispatch, isBinding, selectedIds]);

    const isBound = !!existingBinding;

    return (
        <div ref={rootRef} className="relative" onMouseDown={stopFlowEvent} onPointerDown={stopFlowEvent}>
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={handleToggleOpen}
                className={cn(
                    "inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition",
                    open || isBound ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
                )}
            >
                {isBound ? (
                    <Check className="size-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                ) : (
                    <UserRound className="size-3.5 shrink-0" strokeWidth={1.8} />
                )}
                {isBound ? "已绑定角色" : "绑定角色"}
                <ChevronDown
                    className={cn("size-3.5 shrink-0 text-slate-400 transition", open ? "rotate-180" : "")}
                    strokeWidth={1.8}
                />
            </button>

            {open ? (
                <div
                    className="nodrag nopan absolute bottom-full left-0 z-50 mb-2 w-[360px] rounded-2xl border border-black/5 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
                    onMouseDown={stopFlowEvent}
                    onPointerDown={stopFlowEvent}
                >
                    <p className="px-1 pb-1 text-sm font-medium text-slate-900">绑定到角色</p>
                    <p className="px-1 pb-3 text-xs leading-5 text-slate-500">
                        展开分组后可单选或多选形象，也可使用全选
                    </p>

                    <CanvasAudioBindCharacterTree
                        groups={characterGroups}
                        selectedIds={selectedIds}
                        expandedGroupKeys={expandedGroupKeys}
                        disabled={isBinding}
                        onSelectedIdsChange={setSelectedIds}
                        onExpandedGroupKeysChange={setExpandedGroupKeys}
                    />

                    <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                        <button
                            type="button"
                            disabled={isBinding || selectedIds.size === 0}
                            onClick={() => {
                                void handleConfirmBind();
                            }}
                            className={cn(
                                "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition",
                                isBinding || selectedIds.size === 0
                                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                    : "bg-violet-600 text-white hover:bg-violet-700",
                            )}
                        >
                            {isBinding ? <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> : null}
                            确认绑定{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export const CanvasAudioBindCharacterPopover = memo(CanvasAudioBindCharacterPopoverComponent);
