/**
 * Agent 智能路由类型定义
 */

// AgentCapability Agent 能力标签
export type AgentCapability =
    | "image_generation"
    | "video_generation"
    | "script_writing"
    | "storyboard"
    | "asset_management"
    | "multimodal_reference";

// AgentDefinition 可路由 Agent 的元数据
export type AgentDefinition = {
    id: string;
    name: string;
    description: string;
    capabilities: AgentCapability[];
    keywords: string[];
    routePath: string;
};

// AgentRouteAlternative 备选 Agent 推荐
export type AgentRouteAlternative = {
    agentId: string;
    agentName: string;
    score: number;
    reason: string;
};

// AgentRouteResult 路由决策结果
export type AgentRouteResult = {
    agentId: string;
    agentName: string;
    routePath: string;
    confidence: number;
    reason: string;
    alternatives: AgentRouteAlternative[];
};
