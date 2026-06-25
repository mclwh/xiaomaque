// 扩展 useRecentProjects：重命名与批量删除项目
import { useCallback, useMemo, useState } from "react";
import { batchDeleteProjects, fetchRecentProjects, updateProjectTitle } from "@/api/project";
import { useAsyncRequest } from "@/hooks/useAsyncRequest";
import { mapRecentProjectToNovelProject } from "@/lib/novelProjectMapper";

// 获取最近项目列表并映射为卡片展示数据
export function useRecentProjects(limit = 12) {
    const { data, loading, errorMessage, run } = useAsyncRequest(fetchRecentProjects, {
        immediate: true,
        params: limit,
        defaultErrorMessage: "获取项目列表失败，请稍后重试",
    });
    // deletingProjectIds 正在删除的项目 ID 列表
    const [deletingProjectIds, setDeletingProjectIds] = useState<number[]>([]);
    // renamingProjectIds 正在重命名的项目 ID 列表
    const [renamingProjectIds, setRenamingProjectIds] = useState<number[]>([]);
    // mutationErrorMessage 写操作失败文案
    const [mutationErrorMessage, setMutationErrorMessage] = useState("");

    const projects = useMemo(
        () => (data ?? []).map(mapRecentProjectToNovelProject),
        [data],
    );

    // 重新拉取项目列表
    const refresh = useCallback(async () => {
        await run(limit);
    }, [limit, run]);

    // 重命名项目
    const renameProject = useCallback(
        async (projectId: number, title: string) => {
            if (renamingProjectIds.includes(projectId)) {
                return false;
            }

            setRenamingProjectIds((current) => [...current, projectId]);
            setMutationErrorMessage("");

            try {
                await updateProjectTitle(projectId, title);
                await run(limit);
                return true;
            } catch {
                setMutationErrorMessage("重命名失败，请稍后重试");
                return false;
            } finally {
                setRenamingProjectIds((current) => current.filter((id) => id !== projectId));
            }
        },
        [limit, renamingProjectIds, run],
    );

    // 批量删除项目
    const deleteProjects = useCallback(
        async (projectIds: number[]) => {
            const uniqueProjectIds = [...new Set(projectIds)];

            if (uniqueProjectIds.length === 0) {
                return false;
            }

            if (uniqueProjectIds.some((projectId) => deletingProjectIds.includes(projectId))) {
                return false;
            }

            setDeletingProjectIds((current) => [...current, ...uniqueProjectIds]);
            setMutationErrorMessage("");

            try {
                await batchDeleteProjects(uniqueProjectIds);
                await run(limit);
                return true;
            } catch {
                setMutationErrorMessage("删除项目失败，请稍后重试");
                return false;
            } finally {
                setDeletingProjectIds((current) =>
                    current.filter((projectId) => !uniqueProjectIds.includes(projectId)),
                );
            }
        },
        [deletingProjectIds, limit, run],
    );

    return {
        projects,
        loading,
        errorMessage: errorMessage || mutationErrorMessage,
        refresh,
        renameProject,
        deleteProjects,
        deletingProjectIds,
        renamingProjectIds,
    };
}
