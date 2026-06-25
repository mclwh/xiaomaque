// 短剧 Agent 单个项目卡片
import { Clapperboard } from "lucide-react";
import { NovelProjectMoreActionsPopover } from "@/components/novel/NovelProjectMoreActionsPopover";
import type { NovelProject } from "@/data/novelProjects";
import { cn } from "@/lib/utils";

type NovelProjectCardProps = {
    project: NovelProject;
    selected?: boolean;
    selectionMode?: boolean;
    deleting?: boolean;
    onToggleSelect?: (project: NovelProject) => void;
    onOpen?: (project: NovelProject) => void;
    onRename?: (project: NovelProject) => void;
    onDelete?: (project: NovelProject) => void;
};

// 判断项目是否可操作（非示例且 ID 为数字）
function isEditableProject(project: NovelProject) {
    return !project.isExample && /^\d+$/.test(project.id);
}

// 渲染单个短剧项目卡片
export function NovelProjectCard({
    project,
    selected = false,
    selectionMode = false,
    deleting = false,
    onToggleSelect,
    onOpen,
    onRename,
    onDelete,
}: NovelProjectCardProps) {
    const editable = isEditableProject(project);

    // 点击封面或标题区域
    const handleOpen = () => {
        if (!editable) {
            return;
        }

        if (selectionMode) {
            onToggleSelect?.(project);
            return;
        }

        onOpen?.(project);
    };

    return (
        <article
            className={cn(
                "xyq-novel-project-card group overflow-hidden rounded-2xl border border-black/5 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                selected && "ring-2 ring-black/80",
            )}
        >
            <button
                type="button"
                className="relative flex w-full aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden bg-[#ececef]"
                onClick={handleOpen}
            >
                <Clapperboard
                    className="size-10 text-slate-300 transition group-hover:text-slate-400"
                    strokeWidth={1.5}
                    aria-hidden
                />

                {editable ? (
                    <label
                        className={cn(
                            "absolute left-3 top-3 z-10 flex size-5 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white/95 shadow-sm transition",
                            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        )}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <input
                            type="checkbox"
                            checked={selected}
                            className="size-3.5 cursor-pointer accent-black"
                            onChange={() => onToggleSelect?.(project)}
                        />
                    </label>
                ) : null}

                {project.isExample ? (
                    <span className="absolute left-3 top-3 rounded-md bg-violet-600/90 px-2 py-0.5 text-xs text-white">
                        示例
                    </span>
                ) : null}

                <span className="absolute bottom-3 right-3 rounded-md bg-black/45 px-2 py-0.5 text-xs text-white backdrop-blur">
                    {project.episodeCount} 集
                </span>
            </button>

            <div className="flex items-start gap-1 p-4">
                <button
                    type="button"
                    className="min-w-0 flex-1 cursor-pointer space-y-1 text-left"
                    onClick={handleOpen}
                >
                    <h3 className="truncate text-sm font-medium text-slate-900">{project.title}</h3>
                    <p className="text-xs text-slate-400">{project.updatedAt}</p>
                </button>

                {editable ? (
                    <NovelProjectMoreActionsPopover
                        deleting={deleting}
                        onRename={() => onRename?.(project)}
                        onDelete={() => onDelete?.(project)}
                    />
                ) : null}
            </div>
        </article>
    );
}
