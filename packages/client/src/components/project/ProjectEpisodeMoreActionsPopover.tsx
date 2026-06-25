// 分集卡片「更多操作」弹层
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { cn } from "@/lib/utils";

type ProjectEpisodeMoreActionsPopoverProps = {
    deleting?: boolean;
    onRename: () => void;
    onDelete: () => void | Promise<void>;
};

// 渲染分集卡片更多操作弹层
export function ProjectEpisodeMoreActionsPopover({
    deleting = false,
    onRename,
    onDelete,
}: ProjectEpisodeMoreActionsPopoverProps) {
    // open 弹层是否展开
    const [open, setOpen] = useState(false);
    // rootRef 弹层根节点
    const rootRef = useRef<HTMLDivElement>(null);

    usePopoverDismiss(rootRef, open, () => setOpen(false));

    // 切换弹层展开状态
    const handleToggleOpen = useCallback(() => {
        setOpen((current) => !current);
    }, []);

    // 点击重命名分集
    const handleRename = useCallback(() => {
        setOpen(false);
        onRename();
    }, [onRename]);

    // 点击删除分集
    const handleDelete = useCallback(() => {
        setOpen(false);
        void onDelete();
    }, [onDelete]);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                aria-label="更多操作"
                aria-expanded={open}
                aria-haspopup="menu"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deleting}
                onClick={handleToggleOpen}
            >
                {deleting ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
                ) : (
                    <MoreHorizontal className="size-4" strokeWidth={1.8} />
                )}
            </button>

            {open ? (
                <div
                    role="menu"
                    className="absolute bottom-full right-0 z-20 mb-2 min-w-[132px] rounded-xl border border-black/5 bg-white p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
                >
                    <button
                        type="button"
                        role="menuitem"
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                        onClick={handleRename}
                    >
                        <Pencil className="size-4" strokeWidth={1.8} />
                        重命名
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        className={cn(
                            "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-50",
                        )}
                        onClick={handleDelete}
                    >
                        <Trash2 className="size-4" strokeWidth={1.8} />
                        删除
                    </button>
                </div>
            ) : null}
        </div>
    );
}
