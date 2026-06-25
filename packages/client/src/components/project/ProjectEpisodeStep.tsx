// 项目工作流：分集视频步骤
import { Layers, Pencil, Play, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectEpisodeMoreActionsPopover } from "@/components/project/ProjectEpisodeMoreActionsPopover";
import { RenameDialog } from "@/components/ui/rename-dialog";
import { useProjectSeries } from "@/hooks/useProjectSeries";
import { getEpisodeEditPath } from "@/lib/episodeEditPaths";
import {
    formatSerieEpisodeCardTitle,
    formatSerieEpisodeStats,
    resolveSerieEditableSubtitle,
    resolveSerieStatusLabel,
} from "@/lib/serieEpisode";
import { cn } from "@/lib/utils";

type ProjectEpisodeStepProps = {
    projectId: number;
};

// 渲染分集视频步骤内容
export function ProjectEpisodeStep({ projectId }: ProjectEpisodeStepProps) {
    const navigate = useNavigate();
    const {
        series,
        loading,
        creating,
        deletingSerieIds,
        renamingSerieIds,
        errorMessage,
        addSerie,
        deleteSeries,
        renameSerie,
    } = useProjectSeries(projectId);
    // renamingSerieId 当前打开重命名弹窗的分集 ID
    const [renamingSerieId, setRenamingSerieId] = useState<number | null>(null);

    const renamingSerie = useMemo(
        () => series.find((item) => item.id === renamingSerieId) ?? null,
        [renamingSerieId, series],
    );
    const renamingEpisodeIndex = useMemo(() => {
        if (!renamingSerie) {
            return 0;
        }

        return series.findIndex((item) => item.id === renamingSerie.id) + 1;
    }, [renamingSerie, series]);

    // 点击新增一集
    const handleAddSerie = useCallback(() => {
        void addSerie();
    }, [addSerie]);

    // 进入分集编辑页
    const handleOpenEdit = useCallback(
        (serieId: number) => {
            navigate(getEpisodeEditPath(projectId, serieId));
        },
        [navigate, projectId],
    );

    // 打开重命名弹窗
    const handleOpenRename = useCallback((serieId: number) => {
        setRenamingSerieId(serieId);
    }, []);

    // 关闭重命名弹窗
    const handleCloseRename = useCallback(() => {
        setRenamingSerieId(null);
    }, []);

    // 提交分集重命名
    const handleSubmitRename = useCallback(
        async (subtitle: string) => {
            if (!renamingSerie) {
                return;
            }

            const updated = await renameSerie(renamingSerie.id, subtitle);

            if (updated) {
                setRenamingSerieId(null);
            }
        },
        [renameSerie, renamingSerie],
    );

    // 删除指定分集
    const handleDeleteSerie = useCallback(
        (serieId: number) => {
            void deleteSeries([serieId]);
        },
        [deleteSeries],
    );

    return (
        <div className="mx-auto w-full max-w-[920px] px-6 pb-28 pt-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">
                        分集视频
                    </h2>
                    <p className="text-sm text-slate-500">共 {series.length} 集</p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={creating}
                        onClick={handleAddSerie}
                    >
                        <Plus className="size-4" strokeWidth={2} />
                        新增一集
                    </button>
                    <button
                        type="button"
                        className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-400"
                        disabled
                    >
                        <Layers className="size-4" strokeWidth={1.8} />
                        批量
                    </button>
                </div>
            </div>

            {errorMessage ? (
                <p className="mb-4 text-sm text-red-500">{errorMessage}</p>
            ) : null}

            {loading ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-[20px] bg-white text-sm text-slate-400">
                    加载中...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {series.map((serie, index) => {
                        const episodeIndex = index + 1;
                        const statusLabel = resolveSerieStatusLabel(serie.fragments, serie.params);
                        const isDeleting = deletingSerieIds.includes(serie.id);
                        const isRenaming = renamingSerieIds.includes(serie.id);

                        return (
                            <article
                                key={serie.id}
                                className="flex min-w-0 gap-4 rounded-[20px] bg-white p-4 shadow-sm"
                            >
                                <div className="flex size-[120px] shrink-0 items-center justify-center rounded-2xl bg-[#efeff4]">
                                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-white/80 text-slate-500">
                                        <Play className="size-5" strokeWidth={1.8} />
                                    </span>
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                                    <div className="space-y-2">
                                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                            {statusLabel}
                                        </span>
                                        <h3 className="truncate text-lg font-semibold text-slate-900">
                                            {formatSerieEpisodeCardTitle(serie, episodeIndex)}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {formatSerieEpisodeStats(serie)}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            disabled={isDeleting || isRenaming}
                                            onClick={() => handleOpenEdit(serie.id)}
                                        >
                                            <Pencil className="size-3.5" strokeWidth={1.8} />
                                            编辑
                                        </button>
                                        <ProjectEpisodeMoreActionsPopover
                                            deleting={isDeleting}
                                            onRename={() => handleOpenRename(serie.id)}
                                            onDelete={() => handleDeleteSerie(serie.id)}
                                        />
                                    </div>
                                </div>
                            </article>
                        );
                    })}

                    {series.length === 0 ? (
                        <div
                            className={cn(
                                "col-span-full flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-slate-200 bg-white text-center",
                            )}
                        >
                            <p className="text-sm text-slate-500">还没有分集，点击右上角新增一集</p>
                            <button
                                type="button"
                                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={creating}
                                onClick={handleAddSerie}
                            >
                                <Plus className="size-4" strokeWidth={2} />
                                新增一集
                            </button>
                        </div>
                    ) : null}
                </div>
            )}

            <RenameDialog
                open={renamingSerieId !== null}
                title="重命名分集"
                description={`第${renamingEpisodeIndex}集的展示名称`}
                inputLabel="分集名称"
                initialValue={renamingSerie ? resolveSerieEditableSubtitle(renamingSerie) : ""}
                saving={renamingSerie ? renamingSerieIds.includes(renamingSerie.id) : false}
                onClose={handleCloseRename}
                onSubmit={handleSubmitRename}
            />
        </div>
    );
}
