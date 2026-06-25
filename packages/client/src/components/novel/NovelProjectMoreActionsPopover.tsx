// 短剧项目卡片「更多操作」悬浮菜单
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useCallback, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

type NovelProjectMoreActionsPopoverProps = {
    deleting?: boolean;
    onRename: () => void;
    onDelete: () => void;
};

// 渲染短剧项目卡片更多操作悬浮菜单
export function NovelProjectMoreActionsPopover({
    deleting = false,
    onRename,
    onDelete,
}: NovelProjectMoreActionsPopoverProps) {
    // open 菜单是否展开
    const [open, setOpen] = useState(false);
    // hideTimerRef 延迟关闭菜单的定时器
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 展开菜单
    const showMenu = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }

        setOpen(true);
    }, []);

    // 延迟关闭菜单，便于移入菜单项
    const scheduleHideMenu = useCallback(() => {
        hideTimerRef.current = setTimeout(() => {
            setOpen(false);
            hideTimerRef.current = null;
        }, 120);
    }, []);

    // 点击重命名
    const handleRename = useCallback(
        (event: MouseEvent) => {
            event.stopPropagation();
            setOpen(false);
            onRename();
        },
        [onRename],
    );

    // 点击删除
    const handleDelete = useCallback(
        (event: MouseEvent) => {
            event.stopPropagation();
            setOpen(false);
            onDelete();
        },
        [onDelete],
    );

    return (
        <div
            className="relative shrink-0"
            onMouseEnter={showMenu}
            onMouseLeave={scheduleHideMenu}
            onClick={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                aria-label="更多操作"
                aria-expanded={open}
                aria-haspopup="menu"
                disabled={deleting}
                className={cn(
                    "inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60",
                    open && "opacity-100",
                )}
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
                    onMouseEnter={showMenu}
                    onMouseLeave={scheduleHideMenu}
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
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
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
