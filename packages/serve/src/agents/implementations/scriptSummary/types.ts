/**
 * 剧本摘要 Agent 输出类型
 */

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

// ScriptSummaryAgentOutput Agent 生成的剧本摘要结果（未持久化）
export type ScriptSummaryAgentOutput = {
    agentId: string;
    agentName: string;
    summary: ScriptSummary;
    text: string;
};

// ScriptSummaryResult 剧本摘要完整响应（含持久化后的项目信息）
export type ScriptSummaryResult = ScriptSummaryAgentOutput & {
    projectId: number;
    scriptId: number;
    projectTitle: string;
};

// ScriptSummaryAgentInput 剧本摘要 Agent 入参
export type ScriptSummaryAgentInput = {
    creative: string;
    episodeCount?: number;
    imageStyleId?: string;
};
