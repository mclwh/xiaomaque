// 项目分集列表：加载、新增与删除分集
import { useCallback, useEffect, useRef, useState } from "react";
import {
    batchDeleteProjectSeries,
    createProjectSerie,
    fetchProjectSeries,
    updateProjectSerieName,
    type ProjectSerie,
} from "@/api/serie";
import { isAbortError } from "@/lib/isAbortError";
import { buildNextSerieCreateInput } from "@/lib/serieEpisode";
import { removeSeriesByIds, upsertSerieInList } from "@/lib/serieList";

// 加载项目分集列表并在本地追加新建分集
export function useProjectSeries(projectId: number) {
    const enabled = Number.isFinite(projectId) && projectId > 0;
    // series 当前分集列表
    const [series, setSeries] = useState<ProjectSerie[]>([]);
    // loading 首次加载中
    const [loading, setLoading] = useState(false);
    // creating 新建分集中
    const [creating, setCreating] = useState(false);
    // deletingSerieIds 正在删除的分集 ID 集合
    const [deletingSerieIds, setDeletingSerieIds] = useState<number[]>([]);
    // renamingSerieIds 正在重命名的分集 ID 集合
    const [renamingSerieIds, setRenamingSerieIds] = useState<number[]>([]);
    // errorMessage 最近一次失败文案
    const [errorMessage, setErrorMessage] = useState("");
    // loadedRef 是否已完成首次加载
    const loadedRef = useRef(false);

    // projectId 变化时重置列表
    useEffect(() => {
        loadedRef.current = false;
        setSeries([]);
        setLoading(false);
        setCreating(false);
        setDeletingSerieIds([]);
        setRenamingSerieIds([]);
        setErrorMessage("");
    }, [projectId]);

    // 进入分集页时拉取列表
    useEffect(() => {
        if (!enabled) {
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        setErrorMessage("");

        fetchProjectSeries(projectId, controller.signal)
            .then((items) => {
                loadedRef.current = true;
                setSeries(items);
            })
            .catch((error) => {
                if (isAbortError(error)) {
                    return;
                }

                setErrorMessage("加载分集失败");
            })
            .finally(() => {
                setLoading(false);
            });

        return () => {
            controller.abort();
        };
    }, [enabled, projectId]);

    // 新增一集分集视频
    const addSerie = useCallback(async () => {
        if (!enabled || creating) {
            return null;
        }

        const input = buildNextSerieCreateInput(series);
        setCreating(true);
        setErrorMessage("");

        try {
            const created = await createProjectSerie({
                projectId,
                name: input.name,
                params: input.params,
            });
            setSeries((current) => [...current, created]);
            return created;
        } catch {
            setErrorMessage("新增分集失败，请稍后重试");
            return null;
        } finally {
            setCreating(false);
        }
    }, [creating, enabled, projectId, series]);

    // 删除一个或多个分集
    const deleteSeries = useCallback(
        async (serieIds: number[]) => {
            if (!enabled || serieIds.length === 0) {
                return false;
            }

            // uniqueSerieIds 去重后的待删除 ID
            const uniqueSerieIds = [...new Set(serieIds)];

            if (uniqueSerieIds.some((serieId) => deletingSerieIds.includes(serieId))) {
                return false;
            }

            setDeletingSerieIds((current) => [...current, ...uniqueSerieIds]);
            setErrorMessage("");

            try {
                const deleted = await batchDeleteProjectSeries({
                    project_id: projectId,
                    serie_ids: uniqueSerieIds,
                });
                const deletedIds = deleted.map((item) => item.id);
                setSeries((current) => removeSeriesByIds(current, deletedIds));
                return true;
            } catch {
                setErrorMessage("删除分集失败，请稍后重试");
                return false;
            } finally {
                setDeletingSerieIds((current) =>
                    current.filter((serieId) => !uniqueSerieIds.includes(serieId)),
                );
            }
        },
        [deletingSerieIds, enabled, projectId],
    );

    // 重命名分集
    const renameSerie = useCallback(
        async (serieId: number, subtitle: string) => {
            const trimmedSubtitle = subtitle.trim();

            if (!enabled || !trimmedSubtitle || renamingSerieIds.includes(serieId)) {
                return null;
            }

            setRenamingSerieIds((current) => [...current, serieId]);
            setErrorMessage("");

            try {
                const updated = await updateProjectSerieName({
                    project_id: projectId,
                    serie_id: serieId,
                    subtitle: trimmedSubtitle,
                });
                setSeries((current) => upsertSerieInList(current, updated));
                return updated;
            } catch {
                setErrorMessage("重命名分集失败，请稍后重试");
                return null;
            } finally {
                setRenamingSerieIds((current) => current.filter((id) => id !== serieId));
            }
        },
        [enabled, projectId, renamingSerieIds],
    );

    return {
        series,
        loading: enabled && loading && !loadedRef.current,
        creating,
        deletingSerieIds,
        renamingSerieIds,
        errorMessage,
        addSerie,
        deleteSeries,
        renameSerie,
    };
}
