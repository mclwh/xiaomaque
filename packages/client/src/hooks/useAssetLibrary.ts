// 资产库页按 Tab 分页加载跨项目资产列表
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchLibraryAssets } from "@/api/asset";
import { isAbortError } from "@/lib/isAbortError";
import type {
    AssetLibraryFilter,
    AssetLibrarySortOrder,
    AssetLibraryTab,
} from "@/lib/assetLibraryUi";
import {
    groupProjectAssetsForDisplay,
} from "@/lib/projectAssetGroups";
import {
    PROJECT_ASSET_TAB_CATEGORY,
} from "@/lib/projectAssetTabs";
import type { ProjectAsset } from "@/api/asset";

// UseAssetLibraryQuery 资产库查询条件
export type UseAssetLibraryQuery = {
    keyword: string;
    sort: AssetLibrarySortOrder;
    filter: AssetLibraryFilter;
};

// TabLoadState 单个 Tab 的加载状态
type TabLoadState = {
    assets: ProjectAsset[];
    page: number;
    hasMore: boolean;
    total: number;
};

// DEFAULT_TAB_LOAD_STATE 默认 Tab 加载状态
const DEFAULT_TAB_LOAD_STATE: TabLoadState = {
    assets: [],
    page: 0,
    hasMore: true,
    total: 0,
};

// 按 Tab 分页加载用户全部项目下的资产
export function useAssetLibrary(activeTab: AssetLibraryTab, query: UseAssetLibraryQuery) {
    // tabStates 各 Tab 已加载的资产与分页信息
    const [tabStates, setTabStates] = useState<Partial<Record<AssetLibraryTab, TabLoadState>>>({});
    // loading 是否正在加载首页
    const [loading, setLoading] = useState(false);
    // loadingMore 是否正在加载更多
    const [loadingMore, setLoadingMore] = useState(false);
    // errorMessage 最近一次请求失败文案
    const [errorMessage, setErrorMessage] = useState("");
    // requestVersionRef 请求版本号，避免过期响应覆盖
    const requestVersionRef = useRef(0);
    // debouncedKeyword 防抖后的搜索关键词
    const [debouncedKeyword, setDebouncedKeyword] = useState(query.keyword);

    // 搜索关键词防抖
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(query.keyword);
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [query.keyword]);

    const queryKey = `${activeTab}:${debouncedKeyword}:${query.sort}:${query.filter}`;

    // 拉取指定页资产
    const fetchPage = useCallback(
        async (page: number, append: boolean) => {
            const requestVersion = requestVersionRef.current + 1;
            requestVersionRef.current = requestVersion;
            const controller = new AbortController();

            if (page === 1) {
                setLoading(true);
                setErrorMessage("");
            } else {
                setLoadingMore(true);
            }

            try {
                const result = await fetchLibraryAssets({
                    type: PROJECT_ASSET_TAB_CATEGORY[activeTab],
                    page,
                    page_size: 48,
                    sort: query.sort,
                    keyword: debouncedKeyword,
                    filter: query.filter,
                    signal: controller.signal,
                });

                if (requestVersion !== requestVersionRef.current) {
                    return;
                }

                setTabStates((prev) => {
                    const current = prev[activeTab] ?? DEFAULT_TAB_LOAD_STATE;
                    const nextAssets = append ? [...current.assets, ...result.items] : result.items;

                    return {
                        ...prev,
                        [activeTab]: {
                            assets: nextAssets,
                            page: result.page,
                            hasMore: result.hasMore,
                            total: result.total,
                        },
                    };
                });
            } catch (error) {
                if (isAbortError(error)) {
                    return;
                }

                if (requestVersion === requestVersionRef.current) {
                    setErrorMessage("加载资产失败");
                }
            } finally {
                if (requestVersion === requestVersionRef.current) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        },
        [activeTab, debouncedKeyword, query.filter, query.sort],
    );

    // 查询条件变化时重置并拉取第一页
    useEffect(() => {
        requestVersionRef.current += 1;
        setTabStates((prev) => ({
            ...prev,
            [activeTab]: DEFAULT_TAB_LOAD_STATE,
        }));

        void fetchPage(1, false);
    }, [activeTab, queryKey, fetchPage]);

    const currentState = tabStates[activeTab] ?? DEFAULT_TAB_LOAD_STATE;
    const assets = currentState.assets;
    const displayGroups = useMemo(
        () => groupProjectAssetsForDisplay(assets),
        [assets],
    );

    // 滚动到底部时加载下一页
    const loadMore = useCallback(() => {
        if (loading || loadingMore || !currentState.hasMore) {
            return;
        }

        void fetchPage(currentState.page + 1, true);
    }, [currentState.hasMore, currentState.page, fetchPage, loading, loadingMore]);

    // 删除或新增后刷新当前 Tab
    const refresh = useCallback(() => {
        requestVersionRef.current += 1;
        setTabStates((prev) => ({
            ...prev,
            [activeTab]: DEFAULT_TAB_LOAD_STATE,
        }));
        void fetchPage(1, false);
    }, [activeTab, fetchPage]);

    return {
        assets,
        displayGroups,
        loading,
        loadingMore,
        hasMore: currentState.hasMore,
        total: currentState.total,
        errorMessage,
        loadMore,
        refresh,
    };
}
