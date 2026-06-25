// 资产页按 Tab 懒加载并缓存各分类资产列表
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchProjectAssets, type ProjectAsset } from "@/api/asset";
import { isAbortError } from "@/lib/isAbortError";
import {
    countProjectAssetDisplayGroups,
    groupProjectAssetsForDisplay,
} from "@/lib/projectAssetGroups";
import {
    PROJECT_ASSET_TAB_CATEGORY,
    PROJECT_ASSET_TAB_KEYS,
    type ProjectAssetTabCounts,
    type ProjectAssetTabKey,
} from "@/lib/projectAssetTabs";

// TabAssetCache 各 Tab 已加载的资产列表缓存
type TabAssetCache = Partial<Record<ProjectAssetTabKey, ProjectAsset[]>>;

// TabCountMap 各 Tab 资产数量
type TabCountMap = Record<ProjectAssetTabKey, number>;

// 按 Tab 懒加载项目资产，切换 Tab 时保留已加载数据
export function useProjectAssetTabs(
    projectId: number,
    activeTab: ProjectAssetTabKey,
    initialTabCounts?: ProjectAssetTabCounts,
) {
    const enabled = Number.isFinite(projectId) && projectId > 0;
    // cache 各 Tab 已缓存的资产列表
    const [cache, setCache] = useState<TabAssetCache>({});
    // loadedTabs 已完成首次加载的 Tab 集合
    const loadedTabsRef = useRef<Set<ProjectAssetTabKey>>(new Set());
    // loadingTab 当前正在请求的 Tab
    const [loadingTab, setLoadingTab] = useState<ProjectAssetTabKey | null>(null);
    // errorMessage 最近一次请求失败文案
    const [errorMessage, setErrorMessage] = useState("");

    // projectId 变化时清空缓存
    useEffect(() => {
        loadedTabsRef.current = new Set();
        setCache({});
        setLoadingTab(null);
        setErrorMessage("");
    }, [projectId]);

    // activeTab 变化时按需拉取对应分类（已缓存则跳过）
    useEffect(() => {
        if (!enabled) {
            return;
        }

        if (loadedTabsRef.current.has(activeTab)) {
            return;
        }

        const controller = new AbortController();
        setLoadingTab(activeTab);
        setErrorMessage("");

        fetchProjectAssets(projectId, {
            categoryType: PROJECT_ASSET_TAB_CATEGORY[activeTab],
            signal: controller.signal,
        })
            .then((assets) => {
                loadedTabsRef.current.add(activeTab);
                setCache((prev) => ({ ...prev, [activeTab]: assets }));
            })
            .catch((error) => {
                if (isAbortError(error)) {
                    return;
                }

                setErrorMessage("加载资产失败");
            })
            .finally(() => {
                setLoadingTab((current) => (current === activeTab ? null : current));
            });

        return () => {
            controller.abort();
        };
    }, [activeTab, enabled, projectId]);

    // tabCounts 各 Tab 展示分组数量（同 derive_id 合并计数）
    const tabCounts = useMemo(() => {
        return Object.fromEntries(
            PROJECT_ASSET_TAB_KEYS.map((tabKey) => [
                tabKey,
                cache[tabKey] !== undefined
                    ? countProjectAssetDisplayGroups(cache[tabKey]!)
                    : (initialTabCounts?.[tabKey] ?? 0),
            ]),
        ) as TabCountMap;
    }, [cache, initialTabCounts]);

    const assets = cache[activeTab] ?? [];
    const displayGroups = useMemo(
        () => groupProjectAssetsForDisplay(assets),
        [assets],
    );
    const loading = enabled && loadingTab === activeTab && !loadedTabsRef.current.has(activeTab);

    return {
        assets,
        displayGroups,
        loading,
        errorMessage,
        tabCounts,
    };
}
