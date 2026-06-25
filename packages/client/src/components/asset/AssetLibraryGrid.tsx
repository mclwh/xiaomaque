// 资产库 Tab 虚拟列表网格
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProjectAsset } from "@/api/asset";
import { AssetLibraryCard } from "@/components/asset/AssetLibraryCard";
import { getCanvasPagePath } from "@/hooks/useEnterFreeCanvas";
import {
    ASSET_LIBRARY_GRID_GAP,
    ASSET_LIBRARY_TABS,
    type AssetLibraryTab,
    type AssetLibraryViewMode,
} from "@/lib/assetLibraryUi";
import {
    chunkAssetLibraryDisplayGroups,
    getAssetLibraryAdaptiveCardWidth,
    getAssetLibraryColumnCount,
    getAssetLibraryVirtualRowHeight,
} from "@/lib/assetLibraryLayout";
import type { ProjectAssetDisplayGroup } from "@/lib/projectAssetGroups";

type AssetLibraryGridProps = {
    activeTab: AssetLibraryTab;
    displayGroups: ProjectAssetDisplayGroup[];
    viewMode: AssetLibraryViewMode;
    selectionMode?: boolean;
    selectedKeys?: Set<string>;
    loading?: boolean;
    loadingMore?: boolean;
    hasMore?: boolean;
    errorMessage?: string;
    onLoadMore?: () => void;
    onToggleSelect?: (groupKey: string) => void;
};

// 渲染资产库 Tab 虚拟列表
export function AssetLibraryGrid({
    activeTab,
    displayGroups,
    viewMode,
    selectionMode = false,
    selectedKeys = new Set(),
    loading = false,
    loadingMore = false,
    hasMore = false,
    errorMessage = "",
    onLoadMore,
    onToggleSelect,
}: AssetLibraryGridProps) {
    const navigate = useNavigate();
    const parentRef = useRef<HTMLDivElement | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    // containerWidth 列表容器宽度，用于计算列数
    const [containerWidth, setContainerWidth] = useState(0);
    const activeTabConfig =
        ASSET_LIBRARY_TABS.find((tab) => tab.id === activeTab) ?? ASSET_LIBRARY_TABS[0];
    const layoutReady = containerWidth > 0;
    const columnCount =
        viewMode === "list" || !layoutReady
            ? 1
            : getAssetLibraryColumnCount(containerWidth, activeTab);
    const adaptiveCardWidth =
        viewMode === "list" || !layoutReady
            ? 0
            : getAssetLibraryAdaptiveCardWidth(containerWidth, columnCount, activeTab);
    const rows = useMemo(
        () => chunkAssetLibraryDisplayGroups(displayGroups, columnCount),
        [columnCount, displayGroups],
    );
    const rowHeight = getAssetLibraryVirtualRowHeight(
        activeTab,
        viewMode,
        viewMode === "grid" ? adaptiveCardWidth : undefined,
    );

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 4,
    });

    // 滚动容器挂载后监听宽度（加载态提前 return 时 ref 尚未挂载，需用 callback ref）
    const setScrollContainerRef = useCallback((element: HTMLDivElement | null) => {
        parentRef.current = element;
        resizeObserverRef.current?.disconnect();
        resizeObserverRef.current = null;

        if (!element) {
            return;
        }

        const updateWidth = () => {
            setContainerWidth(element.clientWidth);
        };

        updateWidth();
        const resizeObserver = new ResizeObserver(() => {
            updateWidth();
        });
        resizeObserver.observe(element);
        resizeObserverRef.current = resizeObserver;
    }, []);

    // 列数或行高变化时重新测量虚拟列表
    useEffect(() => {
        rowVirtualizer.measure();
    }, [rowVirtualizer, rowHeight, columnCount, rows.length]);

    // 接近底部时加载更多
    useEffect(() => {
        if (!onLoadMore || !hasMore || loading || loadingMore || rows.length === 0) {
            return;
        }

        const virtualItems = rowVirtualizer.getVirtualItems();
        const lastItem = virtualItems[virtualItems.length - 1];

        if (lastItem && lastItem.index >= rows.length - 2) {
            onLoadMore();
        }
    }, [
        hasMore,
        loading,
        loadingMore,
        onLoadMore,
        rowVirtualizer.range,
        rows.length,
    ]);

    // 点击资产卡片进入所属项目画布
    const handleAssetClick = (asset: ProjectAsset) => {
        navigate(getCanvasPagePath(asset.projectId, asset.id));
    };

    if (loading && displayGroups.length === 0) {
        return (
            <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
                加载中...
            </div>
        );
    }

    if (errorMessage && displayGroups.length === 0) {
        return (
            <div className="flex min-h-[280px] items-center justify-center text-sm text-red-500">
                {errorMessage}
            </div>
        );
    }

    if (displayGroups.length === 0) {
        return (
            <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
                暂无{activeTabConfig.label}
            </div>
        );
    }

    return (
        <div
            ref={setScrollContainerRef}
            className="max-h-[calc(100vh-260px)] min-h-[420px] w-full overflow-y-auto pr-1"
        >
            {!layoutReady && viewMode === "grid" ? (
                <div className="min-h-[280px] w-full" aria-hidden />
            ) : (
                <div
                    className="relative w-full"
                    style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const rowGroups = rows[virtualRow.index] ?? [];

                    return (
                        <div
                            key={virtualRow.key}
                            className="absolute top-0 left-0 w-full"
                            style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <div
                                className="flex w-full"
                                style={{
                                    gap: ASSET_LIBRARY_GRID_GAP,
                                    justifyContent:
                                        viewMode === "list" ? "stretch" : "flex-start",
                                }}
                            >
                                {rowGroups.map((group) => (
                                    <div
                                        key={group.key}
                                        style={
                                            viewMode === "list"
                                                ? { width: "100%" }
                                                : {
                                                      width: adaptiveCardWidth,
                                                      maxWidth: "100%",
                                                      flex: `0 0 ${adaptiveCardWidth}px`,
                                                  }
                                        }
                                    >
                                        <AssetLibraryCard
                                            activeTab={activeTab}
                                            group={group}
                                            viewMode={viewMode}
                                            fluid={viewMode === "grid"}
                                            selectionMode={selectionMode}
                                            selected={selectedKeys.has(group.key)}
                                            onClick={handleAssetClick}
                                            onToggleSelect={onToggleSelect}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                </div>
            )}

            {layoutReady && loadingMore ? (
                <div className="flex items-center justify-center py-4 text-sm text-slate-400">
                    加载更多...
                </div>
            ) : null}
            {layoutReady && !hasMore && displayGroups.length > 0 ? (
                <div className="flex items-center justify-center py-4 text-xs text-slate-400">
                    已加载全部
                </div>
            ) : null}
        </div>
    );
}
