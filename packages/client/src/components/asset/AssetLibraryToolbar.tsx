// 资产库工具栏：搜索、排序、筛选、视图与多选
import {
    ArrowDownUp,
    ChevronDown,
    Filter,
    LayoutGrid,
    List,
    ListChecks,
    Loader2,
    Plus,
    Search,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type {
    AssetLibraryFilter,
    AssetLibrarySortOrder,
    AssetLibraryTab,
    AssetLibraryViewMode,
} from "@/lib/assetLibraryUi";
import { ASSET_LIBRARY_TABS } from "@/lib/assetLibraryUi";
import { cn } from "@/lib/utils";

type AssetLibraryToolbarProps = {
    activeTab: AssetLibraryTab;
    keyword: string;
    sort: AssetLibrarySortOrder;
    filter: AssetLibraryFilter;
    viewMode: AssetLibraryViewMode;
    selectionMode: boolean;
    creating?: boolean;
    onKeywordChange: (value: string) => void;
    onSortChange: (value: AssetLibrarySortOrder) => void;
    onFilterChange: (value: AssetLibraryFilter) => void;
    onViewModeChange: (value: AssetLibraryViewMode) => void;
    onSelectionModeChange: (value: boolean) => void;
    onCreate: () => void;
};

// 返回当前 Tab 对应的搜索占位文案
function getSearchPlaceholder(tab: AssetLibraryTab) {
    const tabConfig = ASSET_LIBRARY_TABS.find((item) => item.id === tab);

    return `搜索${tabConfig?.label ?? "资产"}`;
}

// 渲染带下拉的菜单按钮
function ToolbarMenuButton({
    label,
    icon: Icon,
    active = false,
    children,
}: {
    label: string;
    icon: typeof Filter;
    active?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 关闭菜单
    const closeMenu = useCallback(() => {
        setOpen(false);
    }, []);

    // 点击外部关闭菜单
    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                className={cn(
                    "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm text-slate-700 hover:bg-black/5",
                    active && "bg-black/5",
                )}
                onClick={() => setOpen((current) => !current)}
            >
                <Icon className="size-4 text-slate-500" strokeWidth={1.8} />
                {label}
                <ChevronDown className="size-3.5 text-slate-400" strokeWidth={2} />
            </button>
            {open ? (
                <div
                    className="absolute top-full right-0 z-30 mt-2 min-w-[132px] rounded-xl border border-black/5 bg-white p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
                    onClick={closeMenu}
                >
                    {children}
                </div>
            ) : null}
        </div>
    );
}

// 渲染资产库右侧工具栏
export function AssetLibraryToolbar({
    activeTab,
    keyword,
    sort,
    filter,
    viewMode,
    selectionMode,
    creating = false,
    onKeywordChange,
    onSortChange,
    onFilterChange,
    onViewModeChange,
    onSelectionModeChange,
    onCreate,
}: AssetLibraryToolbarProps) {
    // 切换排序方向
    const toggleSort = useCallback(() => {
        onSortChange(sort === "desc" ? "asc" : "desc");
    }, [onSortChange, sort]);

    // 切换多选模式
    const toggleSelectionMode = useCallback(() => {
        onSelectionModeChange(!selectionMode);
    }, [onSelectionModeChange, selectionMode]);

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
                type="button"
                disabled={creating}
                className="h-9 rounded-full bg-slate-900 px-4 text-sm text-white hover:bg-slate-800"
                onClick={onCreate}
            >
                {creating ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <Plus className="size-4" />
                )}
                新增
            </Button>

            <label className="relative inline-flex h-9 min-w-[180px] items-center">
                <input
                    type="search"
                    value={keyword}
                    placeholder={getSearchPlaceholder(activeTab)}
                    className="h-9 w-full rounded-full border-0 bg-[#ebebef] pr-10 pl-4 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    onChange={(event) => onKeywordChange(event.target.value)}
                />
                <Search
                    className="pointer-events-none absolute right-3 size-4 text-slate-400"
                    strokeWidth={1.8}
                />
            </label>

            <button
                type="button"
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm text-slate-700 hover:bg-black/5"
                onClick={toggleSort}
            >
                <ArrowDownUp className="size-4 text-slate-500" strokeWidth={1.8} />
                {sort === "desc" ? "倒序" : "正序"}
            </button>

            <button
                type="button"
                className={cn(
                    "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm text-slate-700 hover:bg-black/5",
                    selectionMode && "bg-black/5",
                )}
                onClick={toggleSelectionMode}
            >
                <ListChecks className="size-4 text-slate-500" strokeWidth={1.8} />
                {selectionMode ? "取消选择" : "选择"}
            </button>

            <ToolbarMenuButton
                label="视图"
                icon={LayoutGrid}
                active={viewMode === "list"}
            >
                <button
                    type="button"
                    className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-50",
                        viewMode === "grid" ? "text-slate-900" : "text-slate-600",
                    )}
                    onClick={() => onViewModeChange("grid")}
                >
                    <LayoutGrid className="size-4" strokeWidth={1.8} />
                    网格
                </button>
                <button
                    type="button"
                    className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-50",
                        viewMode === "list" ? "text-slate-900" : "text-slate-600",
                    )}
                    onClick={() => onViewModeChange("list")}
                >
                    <List className="size-4" strokeWidth={1.8} />
                    列表
                </button>
            </ToolbarMenuButton>

            <ToolbarMenuButton
                label="筛选"
                icon={Filter}
                active={filter === "pending"}
            >
                <button
                    type="button"
                    className={cn(
                        "flex w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50",
                        filter === "all" ? "text-slate-900" : "text-slate-600",
                    )}
                    onClick={() => onFilterChange("all")}
                >
                    全部
                </button>
                <button
                    type="button"
                    className={cn(
                        "flex w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50",
                        filter === "pending" ? "text-slate-900" : "text-slate-600",
                    )}
                    onClick={() => onFilterChange("pending")}
                >
                    待补充
                </button>
            </ToolbarMenuButton>
        </div>
    );
}
