// 分集编辑页：加载项目全部资产（多组件共享，单次请求去重）
import { useCallback, useSyncExternalStore } from "react";
import { fetchProjectAssets, type ProjectAsset } from "@/api/asset";
import { isAbortError } from "@/lib/isAbortError";

// EpisodeEditAssetsSnapshot 资产列表快照
type EpisodeEditAssetsSnapshot = {
    assets: ProjectAsset[];
    loading: boolean;
    errorMessage: string;
};

// EpisodeEditAssetsCacheEntry 按项目缓存的资产加载状态
type EpisodeEditAssetsCacheEntry = {
    snapshot: EpisodeEditAssetsSnapshot;
    listeners: Set<() => void>;
    abortController: AbortController | null;
    loaded: boolean;
};

// EMPTY_EPISODE_EDIT_ASSETS_SNAPSHOT 未启用时的空快照
const EMPTY_EPISODE_EDIT_ASSETS_SNAPSHOT: EpisodeEditAssetsSnapshot = {
    assets: [],
    loading: false,
    errorMessage: "",
};

// PENDING_EPISODE_EDIT_ASSETS_SNAPSHOT 首次订阅前的稳定加载快照（须保持引用稳定）
const PENDING_EPISODE_EDIT_ASSETS_SNAPSHOT: EpisodeEditAssetsSnapshot = {
    assets: [],
    loading: true,
    errorMessage: "",
};

// episodeEditAssetsCache 分集编辑页资产缓存（按 projectId）
const episodeEditAssetsCache = new Map<number, EpisodeEditAssetsCacheEntry>();

// 异步通知订阅者（禁止在 subscribe 回调内同步触发 listener）
function scheduleEpisodeEditAssetsNotify(entry: EpisodeEditAssetsCacheEntry) {
    queueMicrotask(() => {
        entry.listeners.forEach((listener) => listener());
    });
}

// 创建或获取项目资产缓存条目
function getOrCreateEpisodeEditAssetsEntry(projectId: number): EpisodeEditAssetsCacheEntry {
    const existing = episodeEditAssetsCache.get(projectId);

    if (existing) {
        return existing;
    }

    const entry: EpisodeEditAssetsCacheEntry = {
        snapshot: PENDING_EPISODE_EDIT_ASSETS_SNAPSHOT,
        listeners: new Set(),
        abortController: null,
        loaded: false,
    };

    episodeEditAssetsCache.set(projectId, entry);

    return entry;
}

// 拉取项目资产（同一 projectId 仅一个进行中的请求）
function ensureEpisodeEditAssetsLoaded(projectId: number, entry: EpisodeEditAssetsCacheEntry) {
    if (entry.abortController) {
        return;
    }

    if (entry.loaded) {
        return;
    }

    const controller = new AbortController();
    entry.abortController = controller;

    // 失败后重试：切回加载态；初始 PENDING 时不替换快照、不通知
    if (entry.snapshot !== PENDING_EPISODE_EDIT_ASSETS_SNAPSHOT && !entry.snapshot.loading) {
        entry.snapshot = {
            assets: [],
            loading: true,
            errorMessage: "",
        };
        scheduleEpisodeEditAssetsNotify(entry);
    }

    fetchProjectAssets(projectId, { signal: controller.signal })
        .then((list) => {
            if (controller.signal.aborted) {
                return;
            }

            entry.snapshot = {
                assets: list,
                loading: false,
                errorMessage: "",
            };
        })
        .catch((error) => {
            if (isAbortError(error) || controller.signal.aborted) {
                return;
            }

            entry.snapshot = {
                assets: [],
                loading: false,
                errorMessage: "加载素材失败",
            };
        })
        .finally(() => {
            if (entry.abortController === controller) {
                entry.abortController = null;
            }

            if (controller.signal.aborted) {
                return;
            }

            entry.loaded = true;
            scheduleEpisodeEditAssetsNotify(entry);
        });
}

// 读取项目资产快照
function getEpisodeEditAssetsSnapshot(projectId: number, enabled: boolean): EpisodeEditAssetsSnapshot {
    if (!enabled) {
        return EMPTY_EPISODE_EDIT_ASSETS_SNAPSHOT;
    }

    const entry = episodeEditAssetsCache.get(projectId);

    return entry?.snapshot ?? PENDING_EPISODE_EDIT_ASSETS_SNAPSHOT;
}

// 订阅项目资产快照变化
function subscribeEpisodeEditAssets(projectId: number, enabled: boolean, listener: () => void) {
    if (!enabled) {
        return () => {};
    }

    const entry = getOrCreateEpisodeEditAssetsEntry(projectId);
    entry.listeners.add(listener);

    // 推迟到 subscribe 返回后再拉取，避免在 subscribe 内同步 notify
    queueMicrotask(() => {
        if (!entry.listeners.has(listener)) {
            return;
        }

        ensureEpisodeEditAssetsLoaded(projectId, entry);
    });

    return () => {
        entry.listeners.delete(listener);

        if (entry.listeners.size === 0) {
            entry.abortController?.abort();
            episodeEditAssetsCache.delete(projectId);
        }
    };
}

// 拉取项目资产列表（分集编辑页多组件共享，自动去重）
export function useEpisodeEditAssets(projectId: number) {
    const enabled = Number.isFinite(projectId) && projectId > 0;

    const subscribe = useCallback(
        (listener: () => void) => subscribeEpisodeEditAssets(projectId, enabled, listener),
        [projectId, enabled],
    );

    const getSnapshot = useCallback(
        () => getEpisodeEditAssetsSnapshot(projectId, enabled),
        [projectId, enabled],
    );

    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return {
        assets: snapshot.assets,
        loading: enabled && snapshot.loading,
        errorMessage: snapshot.errorMessage,
    };
}
