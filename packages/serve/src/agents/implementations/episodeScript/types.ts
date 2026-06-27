import type { ScriptSummary } from "../scriptSummary/types.js";

// EpisodeOutlineItem 单集大纲（集数 + 名称）
export type EpisodeOutlineItem = {
    episodeNumber: number;
    title: string;
};

// EpisodeScriptStatus 单集剧本生成状态
export type EpisodeScriptStatus = "pending" | "generating" | "completed" | "failed";

// SerieEpisodeItem 分集剧本数组单项（存入 script.serie_content）
export type SerieEpisodeItem = {
    episodeNumber: number;
    title: string;
    content: string;
    status: EpisodeScriptStatus;
};

// EpisodeOutlineAgentInput 分集大纲 Agent 入参
export type EpisodeOutlineAgentInput = {
    creative: string;
    summary: ScriptSummary;
    episodeCount: number;
};

// EpisodeOutlineAgentOutput 分集大纲 Agent 输出
export type EpisodeOutlineAgentOutput = {
    agentId: string;
    agentName: string;
    episodes: EpisodeOutlineItem[];
};

// EpisodeBatchContentItem 批次内单集正文
export type EpisodeBatchContentItem = {
    episodeNumber: number;
    content: string;
};

// EpisodeBatchContentAgentInput 批次正文 Agent 入参
export type EpisodeBatchContentAgentInput = {
    creative: string;
    summary: ScriptSummary;
    episodeCount: number;
    batchStart: number;
    batchEnd: number;
    allEpisodeTitles: EpisodeOutlineItem[];
    existingEpisodes: SerieEpisodeItem[];
};

// EpisodeBatchContentAgentOutput 批次正文 Agent 输出
export type EpisodeBatchContentAgentOutput = {
    episodes: EpisodeBatchContentItem[];
};

// EpisodeScriptAgentOutput 分集剧本完整生成结果
export type EpisodeScriptAgentOutput = {
    agentId: string;
    agentName: string;
    episodes: SerieEpisodeItem[];
};

// EpisodeScriptResult 分集剧本 API 响应（含持久化信息）
export type EpisodeScriptResult = EpisodeScriptAgentOutput & {
    projectId: number;
    scriptId: number;
};
