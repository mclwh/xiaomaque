// 短剧 Agent 项目列表区块
import { useCallback, useMemo, useState } from "react";
import { NovelProjectCard } from "@/components/novel/NovelProjectCard";
import { NovelProjectSelectionBar } from "@/components/novel/NovelProjectSelectionBar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RenameDialog } from "@/components/ui/rename-dialog";
import type { NovelProject } from "@/data/novelProjects";
import { cn } from "@/lib/utils";

type NovelProjectSectionProps = {
    title: string;
    projects: NovelProject[];
    loading?: boolean;
    errorMessage?: string;
    deletingProjectIds?: number[];
    renamingProjectIds?: number[];
    onProjectClick?: (project: NovelProject) => void;
    onRenameProject?: (projectId: number, title: string) => Promise<boolean>;
    onDeleteProjects?: (projectIds: number[]) => Promise<boolean>;
};

// 判断项目是否可管理（非示例且 ID 为数字）
function isEditableProject(project: NovelProject) {
    return !project.isExample && /^\d+$/.test(project.id);
}

// 渲染短剧项目列表区块
export function NovelProjectSection({
    title,
    projects,
    loading = false,
    errorMessage = "",
    deletingProjectIds = [],
    renamingProjectIds = [],
    onProjectClick,
    onRenameProject,
    onDeleteProjects,
}: NovelProjectSectionProps) {
    // selectedProjectIds 已选中的项目 ID 集合
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
    // renamingProject 当前打开重命名弹窗的项目
    const [renamingProject, setRenamingProject] = useState<NovelProject | null>(null);
    // pendingDeleteIds 待确认删除的项目 ID 列表
    const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

    const selectionMode = selectedProjectIds.size > 0;
    const selectedCount = selectedProjectIds.size;
    const deletingSelected = useMemo(
        () =>
            [...selectedProjectIds].some((projectId) =>
                deletingProjectIds.includes(Number(projectId)),
            ),
        [deletingProjectIds, selectedProjectIds],
    );
    const renamingCurrent = renamingProject
        ? renamingProjectIds.includes(Number(renamingProject.id))
        : false;
    const deletingPending = pendingDeleteIds.some((projectId) =>
        deletingProjectIds.includes(projectId),
    );

    // 切换单个项目的选中状态
    const handleToggleSelect = useCallback((project: NovelProject) => {
        if (!isEditableProject(project)) {
            return;
        }

        setSelectedProjectIds((current) => {
            const next = new Set(current);

            if (next.has(project.id)) {
                next.delete(project.id);
            } else {
                next.add(project.id);
            }

            return next;
        });
    }, []);

    // 清空所有选中项
    const handleClearSelection = useCallback(() => {
        setSelectedProjectIds(new Set());
    }, []);

    // 打开重命名弹窗
    const handleOpenRename = useCallback((project: NovelProject) => {
        setRenamingProject(project);
    }, []);

    // 关闭重命名弹窗
    const handleCloseRename = useCallback(() => {
        setRenamingProject(null);
    }, []);

    // 提交重命名
    const handleSubmitRename = useCallback(
        async (nextTitle: string) => {
            if (!renamingProject) {
                return;
            }

            const success = await onRenameProject?.(Number(renamingProject.id), nextTitle);

            if (success) {
                setRenamingProject(null);
            }
        },
        [onRenameProject, renamingProject],
    );

    // 请求删除单个项目
    const handleRequestDeleteProject = useCallback((project: NovelProject) => {
        if (!isEditableProject(project)) {
            return;
        }

        setPendingDeleteIds([Number(project.id)]);
    }, []);

    // 请求批量删除已选项目
    const handleRequestDeleteSelection = useCallback(() => {
        const projectIds = [...selectedProjectIds]
            .map((projectId) => Number(projectId))
            .filter((projectId) => Number.isFinite(projectId));

        if (projectIds.length === 0) {
            return;
        }

        setPendingDeleteIds(projectIds);
    }, [selectedProjectIds]);

    // 关闭删除确认弹窗
    const handleCloseDeleteConfirm = useCallback(() => {
        if (deletingPending) {
            return;
        }

        setPendingDeleteIds([]);
    }, [deletingPending]);

    // 确认删除项目
    const handleConfirmDelete = useCallback(async () => {
        if (pendingDeleteIds.length === 0) {
            return;
        }

        const success = await onDeleteProjects?.(pendingDeleteIds);

        if (success) {
            setPendingDeleteIds([]);
            setSelectedProjectIds((current) => {
                const next = new Set(current);

                pendingDeleteIds.forEach((projectId) => {
                    next.delete(String(projectId));
                });

                return next;
            });
        }
    }, [onDeleteProjects, pendingDeleteIds]);

    if (loading) {
        return (
            <section className="w-full">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                </div>
                <div className="xyq-novel-empty flex min-h-[120px] items-center justify-center rounded-2xl bg-white text-sm text-slate-400">
                    加载中...
                </div>
            </section>
        );
    }

    if (projects.length === 0 && title === "我的项目") {
        return (
            <section className="w-full">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                </div>
                <div
                    className={cn(
                        "xyq-novel-empty flex min-h-[120px] items-center justify-center rounded-2xl bg-white text-sm",
                        errorMessage ? "text-red-500" : "text-slate-400",
                    )}
                >
                    {errorMessage || "暂无项目，上传剧本开始创作"}
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="w-full">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <NovelProjectCard
                            key={project.id}
                            project={project}
                            selected={selectedProjectIds.has(project.id)}
                            selectionMode={selectionMode}
                            deleting={deletingProjectIds.includes(Number(project.id))}
                            onToggleSelect={handleToggleSelect}
                            onOpen={onProjectClick}
                            onRename={handleOpenRename}
                            onDelete={handleRequestDeleteProject}
                        />
                    ))}
                </div>
            </section>

            <NovelProjectSelectionBar
                selectedCount={selectedCount}
                deleting={deletingSelected}
                onClearSelection={handleClearSelection}
                onDelete={handleRequestDeleteSelection}
            />

            <RenameDialog
                open={renamingProject !== null}
                title="重命名项目"
                description="修改后在项目列表中展示"
                inputLabel="项目名称"
                initialValue={renamingProject?.title ?? ""}
                saving={renamingCurrent}
                onClose={handleCloseRename}
                onSubmit={handleSubmitRename}
            />

            <ConfirmDialog
                open={pendingDeleteIds.length > 0}
                title="确认删除项目？"
                description={`将删除已选择的 ${pendingDeleteIds.length} 个项目，包含分集、剧本与资产等数据，删除后无法恢复。`}
                confirmLabel="删除"
                variant="danger"
                confirming={deletingPending}
                onClose={handleCloseDeleteConfirm}
                onConfirm={handleConfirmDelete}
            />
        </>
    );
}
