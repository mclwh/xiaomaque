// 资产库页：复现小麻雀资产库
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AssetLibraryGrid } from "@/components/asset/AssetLibraryGrid";
import { AssetLibrarySelectionBar } from "@/components/asset/AssetLibrarySelectionBar";
import { AssetLibraryTabs } from "@/components/asset/AssetLibraryTabs";
import { AssetLibraryToolbar } from "@/components/asset/AssetLibraryToolbar";
import { useEnterFreeCanvas } from "@/hooks/useEnterFreeCanvas";
import { useAssetLibrary } from "@/hooks/useAssetLibrary";
import { deleteLibraryAssetGroups } from "@/lib/assetLibraryDelete";
import type {
    AssetLibraryFilter,
    AssetLibrarySortOrder,
    AssetLibraryTab,
    AssetLibraryViewMode,
} from "@/lib/assetLibraryUi";

// 渲染资产库页面
export function AssetPage() {
    // activeTab 当前资产库 Tab
    const [activeTab, setActiveTab] = useState<AssetLibraryTab>("character");
    // keyword 搜索关键词
    const [keyword, setKeyword] = useState("");
    // sort 排序方向
    const [sort, setSort] = useState<AssetLibrarySortOrder>("desc");
    // filter 筛选条件
    const [filter, setFilter] = useState<AssetLibraryFilter>("all");
    // viewMode 视图模式
    const [viewMode, setViewMode] = useState<AssetLibraryViewMode>("grid");
    // selectionMode 是否处于多选模式
    const [selectionMode, setSelectionMode] = useState(false);
    // selectedKeys 已选中的展示分组 key
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
    // deleteDialogOpen 删除确认弹窗是否打开
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    // deleting 是否正在删除
    const [deleting, setDeleting] = useState(false);

    const { enterFreeCanvas, loading: creating } = useEnterFreeCanvas();
    const {
        displayGroups,
        loading,
        loadingMore,
        hasMore,
        errorMessage,
        loadMore,
        refresh,
    } = useAssetLibrary(activeTab, { keyword, sort, filter });

    // Tab 切换时清空多选
    useEffect(() => {
        setSelectionMode(false);
        setSelectedKeys(new Set());
    }, [activeTab]);

    const selectedGroups = useMemo(
        () => displayGroups.filter((group) => selectedKeys.has(group.key)),
        [displayGroups, selectedKeys],
    );

    // 切换分组选中状态
    const handleToggleSelect = useCallback((groupKey: string) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);

            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }

            return next;
        });
    }, []);

    // 清空多选
    const handleClearSelection = useCallback(() => {
        setSelectionMode(false);
        setSelectedKeys(new Set());
    }, []);

    // 打开删除确认弹窗
    const handleOpenDeleteDialog = useCallback(() => {
        if (selectedGroups.length === 0) {
            return;
        }

        setDeleteDialogOpen(true);
    }, [selectedGroups.length]);

    // 确认删除选中资产
    const handleConfirmDelete = useCallback(async () => {
        if (selectedGroups.length === 0 || deleting) {
            return;
        }

        setDeleting(true);

        try {
            await deleteLibraryAssetGroups(selectedGroups);
            setDeleteDialogOpen(false);
            handleClearSelection();
            refresh();
        } catch {
            // 删除失败时保持弹窗，用户可重试
        } finally {
            setDeleting(false);
        }
    }, [deleting, handleClearSelection, refresh, selectedGroups]);

    // 切换多选模式
    const handleSelectionModeChange = useCallback((nextMode: boolean) => {
        setSelectionMode(nextMode);

        if (!nextMode) {
            setSelectedKeys(new Set());
        }
    }, []);

    return (
        <div className="relative min-h-full bg-[#f3f3f3]">
            <div className="relative z-[2] mx-auto flex w-full flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
                <h1 className="text-[28px] font-semibold text-slate-900">资产库</h1>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <AssetLibraryTabs activeTab={activeTab} onChange={setActiveTab} />
                    <AssetLibraryToolbar
                        activeTab={activeTab}
                        keyword={keyword}
                        sort={sort}
                        filter={filter}
                        viewMode={viewMode}
                        selectionMode={selectionMode}
                        creating={creating}
                        onKeywordChange={setKeyword}
                        onSortChange={setSort}
                        onFilterChange={setFilter}
                        onViewModeChange={setViewMode}
                        onSelectionModeChange={handleSelectionModeChange}
                        onCreate={enterFreeCanvas}
                    />
                </div>

                <AssetLibraryGrid
                    activeTab={activeTab}
                    displayGroups={displayGroups}
                    viewMode={viewMode}
                    selectionMode={selectionMode}
                    selectedKeys={selectedKeys}
                    loading={loading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    errorMessage={errorMessage}
                    onLoadMore={loadMore}
                    onToggleSelect={handleToggleSelect}
                />
            </div>

            <AssetLibrarySelectionBar
                selectedCount={selectedKeys.size}
                deleting={deleting}
                onClearSelection={handleClearSelection}
                onDelete={handleOpenDeleteDialog}
            />

            <ConfirmDialog
                open={deleteDialogOpen && selectedKeys.size > 0}
                title="确认删除资产？"
                description={`将删除已选择的 ${selectedKeys.size} 项资产，删除后无法恢复。`}
                confirmLabel="确认删除"
                variant="danger"
                confirming={deleting}
                onClose={() => {
                    if (!deleting) {
                        setDeleteDialogOpen(false);
                    }
                }}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
