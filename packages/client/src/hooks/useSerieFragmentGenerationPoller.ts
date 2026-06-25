import { useCallback, useEffect, useState } from "react";
import { pollSerieFragmentGeneration, type ProjectSerie } from "@/api/serie";
import {
    readSerieFragmentGenerationTasks,
    removeSerieFragmentGenerationTask,
    type SerieFragmentGenerationTaskRecord,
} from "@/lib/serieFragmentGenerationTask";

// POLL_INTERVAL_MS 轮询间隔（毫秒）
const POLL_INTERVAL_MS = 10_000;

type UseSerieFragmentGenerationPollerOptions = {
    projectId: number;
    serieId: number;
    enabled: boolean;
    onSucceeded: (serie: ProjectSerie, fragmentId: number) => void;
    onFailed: (message: string, fragmentId: number) => void;
};

// 轮询分镜 Seedance 生成任务并在终态时回调
export function useSerieFragmentGenerationPoller({
    projectId,
    serieId,
    enabled,
    onSucceeded,
    onFailed,
}: UseSerieFragmentGenerationPollerOptions) {
    // generatingFragmentIds 正在生成中的分镜 ID 集合
    const [generatingFragmentIds, setGeneratingFragmentIds] = useState<number[]>([]);

    // 轮询单个任务并在终态时清理 localStorage
    const pollSingleTask = useCallback(
        async (task: SerieFragmentGenerationTaskRecord) => {
            try {
                const result = await pollSerieFragmentGeneration({
                    project_id: task.projectId,
                    serie_id: task.serieId,
                    fragment_id: task.fragmentId,
                    task_id: task.taskId,
                });

                if (result.status === "succeeded" && result.serie) {
                    removeSerieFragmentGenerationTask(task.fragmentId);
                    onSucceeded(result.serie, task.fragmentId);
                    return;
                }

                if (result.status === "failed") {
                    removeSerieFragmentGenerationTask(task.fragmentId);
                    onFailed(result.message ?? "视频生成失败", task.fragmentId);
                }
            } catch {
                removeSerieFragmentGenerationTask(task.fragmentId);
                onFailed("查询生成进度失败", task.fragmentId);
            }
        },
        [onFailed, onSucceeded],
    );

    // 执行单次轮询
    const pollTasksOnce = useCallback(async () => {
        const tasks = readSerieFragmentGenerationTasks(serieId);

        if (tasks.length === 0) {
            setGeneratingFragmentIds([]);
            return;
        }

        setGeneratingFragmentIds(tasks.map((task) => task.fragmentId));

        for (const task of tasks) {
            await pollSingleTask(task);
        }

        setGeneratingFragmentIds(
            readSerieFragmentGenerationTasks(serieId).map((task) => task.fragmentId),
        );
    }, [pollSingleTask, serieId]);

    // 同步 localStorage 中的任务到生成中状态
    const syncGeneratingFragmentIds = useCallback(() => {
        const tasks = readSerieFragmentGenerationTasks(serieId);
        setGeneratingFragmentIds(tasks.map((task) => task.fragmentId));
    }, [serieId]);

    useEffect(() => {
        if (!enabled || !projectId || !serieId) {
            return;
        }

        syncGeneratingFragmentIds();
        void pollTasksOnce();

        const timer = window.setInterval(() => {
            void pollTasksOnce();
        }, POLL_INTERVAL_MS);

        return () => {
            window.clearInterval(timer);
        };
    }, [enabled, pollTasksOnce, projectId, serieId, syncGeneratingFragmentIds]);

    return {
        generatingFragmentIds,
        syncGeneratingFragmentIds,
        refreshPolling: pollTasksOnce,
        isFragmentGenerating: (fragmentId: number) => generatingFragmentIds.includes(fragmentId),
    };
}
