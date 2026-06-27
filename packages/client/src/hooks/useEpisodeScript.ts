// 分集剧本：摘要完成后自动触发生成，生成中轮询详情
import { useCallback, useEffect, useRef, useState } from "react";
import { generateEpisodeScript } from "@/api/episodeScript";
import { fetchScriptDetail, type ScriptDetail } from "@/api/script";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

// POLL_INTERVAL_MS 分集生成中轮询间隔
const POLL_INTERVAL_MS = 2500;

// UseEpisodeScriptOptions 分集剧本 Hook 配置
type UseEpisodeScriptOptions = {
    projectId: number;
    summaryCompleted: boolean;
};

// 管理分集剧本生成与轮询刷新
export function useEpisodeScript({ projectId, summaryCompleted }: UseEpisodeScriptOptions) {
    // script 剧本详情（含 serieContent）
    const [script, setScript] = useState<ScriptDetail | null>(null);
    // generating 是否正在请求生成接口
    const [generating, setGenerating] = useState(false);
    // errorMessage 错误提示
    const [errorMessage, setErrorMessage] = useState("");
    // generateStartedRef 是否已触发过生成
    const generateStartedRef = useRef(false);

    // 拉取剧本详情
    const loadDetail = useCallback(async () => {
        const detail = await fetchScriptDetail(projectId);
        setScript(detail);
        return detail;
    }, [projectId]);

    // 调用分集剧本 Agent
    const startGenerate = useCallback(async () => {
        setGenerating(true);
        setErrorMessage("");

        try {
            await generateEpisodeScript({ project_id: projectId });
            await loadDetail();
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, "分集剧本生成失败，请稍后重试"));

            try {
                await loadDetail();
            } catch {
                // 忽略刷新失败
            }
        } finally {
            setGenerating(false);
        }
    }, [loadDetail, projectId]);

    // 重试生成分集剧本
    const retryGenerate = useCallback(() => {
        generateStartedRef.current = true;
        void startGenerate();
    }, [startGenerate]);

    useEffect(() => {
        generateStartedRef.current = false;
        setScript(null);
        setErrorMessage("");
    }, [projectId]);

    useEffect(() => {
        if (!summaryCompleted) {
            return;
        }

        void loadDetail().catch(() => {
            // 初始加载失败时由后续轮询或重试处理
        });
    }, [loadDetail, projectId, summaryCompleted]);

    useEffect(() => {
        if (!summaryCompleted || !script) {
            return;
        }

        if (script.serieContentStatus === "completed") {
            return;
        }

        if (script.serieContentStatus === "generating") {
            const intervalId = window.setInterval(() => {
                void loadDetail().catch(() => {
                    // 轮询失败时静默忽略
                });
            }, POLL_INTERVAL_MS);

            return () => {
                window.clearInterval(intervalId);
            };
        }

        if (
            (script.serieContentStatus === "pending" || script.serieContentStatus === "failed") &&
            !generateStartedRef.current &&
            !generating
        ) {
            generateStartedRef.current = true;
            void startGenerate();
        }
    }, [generating, loadDetail, script, summaryCompleted, startGenerate]);

    // completedCount 已完成集数
    const completedCount =
        script?.serieContent?.filter((item) => item.status === "completed" && item.content).length ??
        0;
    // totalCount 总集数
    const totalCount = script?.episodeCount ?? script?.serieContent?.length ?? 0;

    return {
        serieContent: script?.serieContent ?? null,
        serieContentStatus: script?.serieContentStatus ?? "pending",
        serieContentError: script?.params.serieContentError,
        generating,
        errorMessage,
        completedCount,
        totalCount,
        retryGenerate,
    };
}
