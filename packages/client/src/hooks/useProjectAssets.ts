// 项目资产列表请求 Hook（基于通用 useAsyncRequest）
import { fetchProjectAssets } from "@/api/asset";
import { useAsyncRequest } from "@/hooks/useAsyncRequest";

type UseProjectAssetsOptions = {
    enabled?: boolean;
    immediate?: boolean;
};

// 加载指定项目的资产列表
export function useProjectAssets(projectId: number, options: UseProjectAssetsOptions = {}) {
    const { enabled = Number.isFinite(projectId) && projectId > 0, immediate = true } = options;

    const { data, loading, errorMessage, run, reset } = useAsyncRequest(fetchProjectAssets, {
        immediate,
        params: projectId,
        enabled,
        defaultErrorMessage: "加载资产失败",
    });

    return {
        assets: data ?? [],
        loading,
        errorMessage,
        hasAssets: (data?.length ?? 0) > 0,
        reload: () => run(projectId),
        reset,
    };
}
