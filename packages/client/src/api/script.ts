import { request } from "@/api/http";
import type { RequestOptions } from "@/api/types";
import type { ImageStyleId } from "@/lib/imageStyles";
import type { ScriptSummary } from "@/api/agent";
import type { SerieEpisodeItem } from "@/api/episodeScript";

// SummaryStatus 剧本摘要生成状态
export type SummaryStatus = "pending" | "generating" | "completed" | "failed";

// ScriptParams 剧本 params 字段
export type ScriptParams = {
    episodeCount?: number;
    imageStyleId?: ImageStyleId;
    text?: string;
    summaryStatus?: SummaryStatus;
    summaryError?: string;
    serieContentStatus?: SummaryStatus;
    serieContentError?: string;
};

// ScriptDetail 剧本详情
export type ScriptDetail = {
    id: number;
    projectId: number;
    name: string;
    source: string | null;
    summary: ScriptSummary | null;
    serieContent: SerieEpisodeItem[] | null;
    params: ScriptParams;
    summaryStatus: SummaryStatus;
    summaryText: string | null;
    serieContentStatus: SummaryStatus;
    episodeCount: number | null;
    createdAt: string;
    updatedAt: string;
};

// ScriptDraftResult 创建剧本草稿响应
export type ScriptDraftResult = {
    projectId: number;
    scriptId: number;
    projectTitle: string;
};

// CreateScriptDraftPayload 创建剧本草稿请求体
export type CreateScriptDraftPayload = {
    creative: string;
    episodeCount?: number;
    imageStyleId?: ImageStyleId;
};

// 立即创建项目与剧本草稿
export function createScriptDraft(payload: CreateScriptDraftPayload) {
    return request<ScriptDraftResult>("/script/create", {
        method: "POST",
        data: payload,
    });
}

// 获取项目关联的剧本详情
export function fetchScriptDetail(projectId: number, options?: RequestOptions) {
    return request<ScriptDetail>("/script/detail", {
        method: "GET",
        params: { project_id: projectId },
        signal: options?.signal,
    });
}
