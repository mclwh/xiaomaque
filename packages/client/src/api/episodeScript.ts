// 分集剧本 API 类型与请求
import { request } from "@/api/http";
import type { SummaryStatus } from "@/api/script";

// EpisodeScriptStatus 单集剧本状态
export type EpisodeScriptStatus = "pending" | "generating" | "completed" | "failed";

// SerieEpisodeItem 分集剧本单项
export type SerieEpisodeItem = {
    episodeNumber: number;
    title: string;
    content: string;
    status: EpisodeScriptStatus;
};

// EpisodeScriptResult 分集剧本生成响应
export type EpisodeScriptResult = {
    agentId: string;
    agentName: string;
    episodes: SerieEpisodeItem[];
    projectId: number;
    scriptId: number;
};

// GenerateEpisodeScriptPayload 生成分集剧本请求体
export type GenerateEpisodeScriptPayload = {
    project_id: number;
};

// SerieContentProgress 分集生成进度（前端推导）
export type SerieContentProgress = {
    completed: number;
    total: number;
    status: SummaryStatus;
};

// 为已有剧本生成全部分集正文
export function generateEpisodeScript(payload: GenerateEpisodeScriptPayload) {
    return request<EpisodeScriptResult>("/agent/episode_script", {
        method: "POST",
        data: payload,
    });
}
