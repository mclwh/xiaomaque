import { request } from "@/api/http";

// ScriptSummaryCharacter 单个人物小传
export type ScriptSummaryCharacter = {
    name: string;
    title: string;
    roleType: string;
    visualImage: string;
    coreTags: string;
    identityBackground: string;
    growthExperience: string;
    personality: string;
    relationships: string;
    growthArc: string;
};

// ScriptSummary 结构化剧本摘要
export type ScriptSummary = {
    episodeCount: number;
    storyType: string;
    targetAudience: string;
    coreHook: string;
    oneLineStory: string;
    characters: ScriptSummaryCharacter[];
    synopsis: string;
};

// ScriptSummaryResult 剧本摘要 Agent 响应
export type ScriptSummaryResult = {
    agentId: string;
    agentName: string;
    summary: ScriptSummary;
    text: string;
    projectId: number;
    scriptId: number;
    projectTitle: string;
};

// GenerateScriptSummaryPayload 剧本摘要请求体
export type GenerateScriptSummaryPayload = {
    project_id: number;
};

// 为已有剧本草稿生成结构化摘要
export function generateScriptSummary(payload: GenerateScriptSummaryPayload) {
    return request<ScriptSummaryResult>("/agent/script_summary", {
        method: "POST",
        data: payload,
    });
}
