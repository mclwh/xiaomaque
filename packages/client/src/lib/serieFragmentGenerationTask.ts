// 分镜视频生成任务 localStorage 持久化

// SERIE_FRAGMENT_GENERATION_TASKS_KEY localStorage 键名
const SERIE_FRAGMENT_GENERATION_TASKS_KEY = "xyq_serie_fragment_generation_tasks_v1";

// SerieFragmentGenerationTaskRecord 分镜生成任务记录
export type SerieFragmentGenerationTaskRecord = {
    projectId: number;
    serieId: number;
    fragmentId: number;
    taskId: string;
    createdAt: number;
};

// 读取 localStorage 中的全部任务记录
function readAllSerieFragmentGenerationTasks(): SerieFragmentGenerationTaskRecord[] {
    try {
        const raw = localStorage.getItem(SERIE_FRAGMENT_GENERATION_TASKS_KEY);

        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw) as unknown;

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.flatMap((item) => {
            if (!item || typeof item !== "object") {
                return [];
            }

            const record = item as Record<string, unknown>;

            if (
                typeof record.projectId !== "number" ||
                typeof record.serieId !== "number" ||
                typeof record.fragmentId !== "number" ||
                typeof record.taskId !== "string" ||
                typeof record.createdAt !== "number"
            ) {
                return [];
            }

            return [
                {
                    projectId: record.projectId,
                    serieId: record.serieId,
                    fragmentId: record.fragmentId,
                    taskId: record.taskId,
                    createdAt: record.createdAt,
                },
            ];
        });
    } catch {
        return [];
    }
}

// 写入 localStorage 任务列表
function writeAllSerieFragmentGenerationTasks(tasks: SerieFragmentGenerationTaskRecord[]) {
    localStorage.setItem(SERIE_FRAGMENT_GENERATION_TASKS_KEY, JSON.stringify(tasks));
}

// 读取指定分集下的生成任务
export function readSerieFragmentGenerationTasks(serieId: number): SerieFragmentGenerationTaskRecord[] {
    return readAllSerieFragmentGenerationTasks().filter((task) => task.serieId === serieId);
}

// 保存或更新分镜生成任务
export function upsertSerieFragmentGenerationTask(task: SerieFragmentGenerationTaskRecord) {
    const tasks = readAllSerieFragmentGenerationTasks().filter(
        (item) => item.fragmentId !== task.fragmentId,
    );

    tasks.push(task);
    writeAllSerieFragmentGenerationTasks(tasks);
}

// 删除分镜生成任务
export function removeSerieFragmentGenerationTask(fragmentId: number) {
    const tasks = readAllSerieFragmentGenerationTasks().filter(
        (item) => item.fragmentId !== fragmentId,
    );

    writeAllSerieFragmentGenerationTasks(tasks);
}
