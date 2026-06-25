// 分集编辑页：底部分镜条
import { Copy, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { resolveSerieFragmentCoverKey, resolveSerieFragmentDisplayLabel, type SerieFragment } from "@/lib/serieFragments";
import { resolveStoragePreviewUrl } from "@/lib/storageUrl";
import { cn } from "@/lib/utils";

type EpisodeEditStoryboardListProps = {
    fragments: SerieFragment[];
    selectedFragmentId: string | null;
    onSelect: (fragmentId: string) => void;
    onInsert: (index: number) => void;
    onDelete: (index: number) => void | Promise<void>;
    onDuplicate: (index: number) => void;
};

type EpisodeEditStoryboardClipProps = {
    fragment: SerieFragment;
    index: number;
    isActive: boolean;
    onSelect: (fragmentId: string) => void;
    clipRef: (node: HTMLButtonElement | null) => void;
};

type EpisodeEditStoryboardInsertSlotProps = {
    insertIndex: number;
    canDuplicateLeft: boolean;
    canDeleteLeft: boolean;
    onInsert: () => void;
    onRequestDeleteLeft: () => void;
    onDuplicateLeft: () => void;
};

// 渲染分镜之间的插入 / 删除 / 复制操作区
function EpisodeEditStoryboardInsertSlot({
    insertIndex,
    canDuplicateLeft,
    canDeleteLeft,
    onInsert,
    onRequestDeleteLeft,
    onDuplicateLeft,
}: EpisodeEditStoryboardInsertSlotProps) {
    return (
        <div
            className="group/slot relative flex w-8 shrink-0 self-stretch pb-6"
            aria-label={`在片段 ${insertIndex + 1} 前插入`}
        >
            <div className="relative flex size-full items-center justify-center">
                <button
                    type="button"
                    aria-label="插入分镜"
                    onClick={onInsert}
                    className={cn(
                        "inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-[#efeff4] text-slate-500 transition hover:bg-[#e4e4ea] hover:text-slate-700",
                        "group-hover/slot:invisible",
                    )}
                >
                    <Plus className="size-4" strokeWidth={1.8} />
                </button>

                <div
                    className={cn(
                        "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 transition",
                        "group-hover/slot:pointer-events-auto group-hover/slot:opacity-100",
                    )}
                >
                    <button
                        type="button"
                        aria-label="插入分镜"
                        onClick={onInsert}
                        className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg bg-[#efeff4] text-slate-500 transition hover:bg-[#e4e4ea] hover:text-slate-700"
                    >
                        <Plus className="size-3.5" strokeWidth={1.8} />
                    </button>
                    <button
                        type="button"
                        aria-label="复制左侧分镜"
                        disabled={!canDuplicateLeft}
                        onClick={onDuplicateLeft}
                        className={cn(
                            "inline-flex size-7 cursor-pointer items-center justify-center rounded-lg bg-[#efeff4] text-slate-500 transition hover:bg-[#e4e4ea] hover:text-slate-700",
                            !canDuplicateLeft && "cursor-not-allowed opacity-40",
                        )}
                    >
                        <Copy className="size-3.5" strokeWidth={1.8} />
                    </button>
                    <button
                        type="button"
                        aria-label="删除左侧分镜"
                        disabled={!canDeleteLeft}
                        onClick={onRequestDeleteLeft}
                        className={cn(
                            "inline-flex size-7 cursor-pointer items-center justify-center rounded-lg bg-[#efeff4] text-slate-500 transition hover:bg-[#e4e4ea] hover:text-slate-700",
                            !canDeleteLeft && "cursor-not-allowed opacity-40",
                        )}
                    >
                        <Trash2 className="size-3.5" strokeWidth={1.8} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// 渲染单个底部分镜缩略图
const EpisodeEditStoryboardClip = memo(function EpisodeEditStoryboardClip({
    fragment,
    index,
    isActive,
    onSelect,
    clipRef,
}: EpisodeEditStoryboardClipProps) {
    // coverKey 分镜封面 key
    const coverKey = resolveSerieFragmentCoverKey(fragment);
    // coverUrl 分镜封面预览地址
    const coverUrl = coverKey ? resolveStoragePreviewUrl(coverKey) : null;
    // fragmentLabel 分镜展示标签
    const fragmentLabel = resolveSerieFragmentDisplayLabel(fragment, index);

    return (
        <button
            ref={clipRef}
            type="button"
            className="flex w-[88px] shrink-0 cursor-pointer flex-col items-center gap-2 text-left"
            onClick={() => onSelect(fragment.id)}
        >
            <div
                className={cn(
                    "flex h-[132px] w-full items-center justify-center rounded-[20px] bg-[#f0f0f2] p-1.5 transition",
                    isActive ? "border-2 border-slate-800" : "border-2 border-transparent",
                )}
            >
                <div className="flex size-full items-center justify-center overflow-hidden rounded-2xl bg-[#e8e8ed]">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={fragmentLabel}
                            className="size-full object-cover"
                        />
                    ) : (
                        <span className="text-sm font-medium text-slate-400">
                            {String(index + 1).padStart(2, "0")}
                        </span>
                    )}
                </div>
            </div>
            <span className="w-full truncate text-center text-xs text-slate-500">
                {fragmentLabel}
            </span>
        </button>
    );
});

// 渲染底部分镜横向列表
export function EpisodeEditStoryboardList({
    fragments,
    selectedFragmentId,
    onSelect,
    onInsert,
    onDelete,
    onDuplicate,
}: EpisodeEditStoryboardListProps) {
    // scrollRef 横向滚动容器
    const scrollRef = useRef<HTMLDivElement>(null);
    // clipRefs 各分镜按钮引用
    const clipRefs = useRef(new Map<string, HTMLButtonElement>());
    // pendingDeleteIndex 待确认删除的分镜索引
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
    // isDeletingFragment 分镜删除保存中
    const [isDeletingFragment, setIsDeletingFragment] = useState(false);

    // pendingDeleteFragment 待删除分镜
    const pendingDeleteFragment =
        pendingDeleteIndex === null ? null : (fragments[pendingDeleteIndex] ?? null);

    // deleteConfirmDescription 删除二次确认文案
    const deleteConfirmDescription = pendingDeleteFragment
        ? `将删除「${resolveSerieFragmentDisplayLabel(
              pendingDeleteFragment,
              pendingDeleteIndex ?? 0,
          )}」及其脚本与生成结果，删除后无法恢复。`
        : "删除后无法恢复，请确认是否删除该片段。";

    // handleDeleteConfirm 确认后删除分镜
    const handleDeleteConfirm = useCallback(async () => {
        if (pendingDeleteIndex === null) {
            return;
        }

        setIsDeletingFragment(true);

        try {
            await onDelete(pendingDeleteIndex);
            setPendingDeleteIndex(null);
        } catch {
            // 删除失败时保留弹窗，由上层 toast 提示
        } finally {
            setIsDeletingFragment(false);
        }
    }, [onDelete, pendingDeleteIndex]);

    // 选中分镜变化时滚动到可见区域
    useEffect(() => {
        if (!selectedFragmentId) {
            return;
        }

        const node = clipRefs.current.get(selectedFragmentId);
        node?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, [selectedFragmentId]);

    return (
        <section className="shrink-0 rounded-t-[24px] border-t border-black/5 bg-white px-4 pb-4 pt-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
            <div
                ref={scrollRef}
                className="flex items-end overflow-x-auto pb-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                {fragments.map((fragment, index) => (
                    <div key={fragment.id} className="flex shrink-0 items-end">
                        <EpisodeEditStoryboardInsertSlot
                            insertIndex={index}
                            canDuplicateLeft={index > 0}
                            canDeleteLeft={index > 0 && fragments.length > 1}
                            onInsert={() => onInsert(index)}
                            onRequestDeleteLeft={() => setPendingDeleteIndex(index - 1)}
                            onDuplicateLeft={() => onDuplicate(index - 1)}
                        />

                        <EpisodeEditStoryboardClip
                            fragment={fragment}
                            index={index}
                            isActive={fragment.id === selectedFragmentId}
                            onSelect={onSelect}
                            clipRef={(node) => {
                                if (node) {
                                    clipRefs.current.set(fragment.id, node);
                                    return;
                                }

                                clipRefs.current.delete(fragment.id);
                            }}
                        />
                    </div>
                ))}

                {fragments.length > 0 ? (
                    <EpisodeEditStoryboardInsertSlot
                        insertIndex={fragments.length}
                        canDuplicateLeft={fragments.length > 0}
                        canDeleteLeft={fragments.length > 1}
                        onInsert={() => onInsert(fragments.length)}
                        onRequestDeleteLeft={() => setPendingDeleteIndex(fragments.length - 1)}
                        onDuplicateLeft={() => onDuplicate(fragments.length - 1)}
                    />
                ) : null}
            </div>

            <ConfirmDialog
                open={pendingDeleteIndex !== null}
                title="确认删除分镜？"
                description={deleteConfirmDescription}
                confirmLabel="删除"
                confirming={isDeletingFragment}
                variant="danger"
                onClose={() => setPendingDeleteIndex(null)}
                onConfirm={handleDeleteConfirm}
            />
        </section>
    );
}
