import type { AgentDefinition } from "./types.js";
import {
    EPISODE_SCRIPT_AGENT_ID,
    EPISODE_SCRIPT_AGENT_NAME,
} from "./implementations/episodeScript/constants.js";
import {
    SCRIPT_SUMMARY_AGENT_ID,
    SCRIPT_SUMMARY_AGENT_NAME,
} from "./implementations/scriptSummary/constants.js";

/**
 * Agent 注册表：维护可路由 Agent 的元数据，按需在此注册真实 Agent
 */

// AGENT_REGISTRY 当前系统支持的全部 Agent
export const AGENT_REGISTRY: AgentDefinition[] = [
    {
        id: SCRIPT_SUMMARY_AGENT_ID,
        name: SCRIPT_SUMMARY_AGENT_NAME,
        description:
            "将原始创意、故事灵感或粗糙大纲转换为结构化剧本摘要，输出集数、故事类型、目标受众、核心梗、一句话故事、人物小传与故事梗概，供短剧立项与编剧使用。",
        capabilities: ["script_writing"],
        keywords: [
            "剧本摘要",
            "创意",
            "大纲",
            "人物小传",
            "故事梗概",
            "改编",
            "短剧",
            "立项",
            "策划",
        ],
        routePath: "",
    },
    {
        id: EPISODE_SCRIPT_AGENT_ID,
        name: EPISODE_SCRIPT_AGENT_NAME,
        description:
            "结合原始创意与剧本摘要，先生成全部分集大纲（集数与集名），再逐集生成符合影视剧本格式的分集正文，写入 serie_content。",
        capabilities: ["script_writing"],
        keywords: [
            "分集剧本",
            "分集",
            "集数",
            "场戏",
            "剧本正文",
            "短剧",
            "连载",
        ],
        routePath: "",
    },
];

// 根据 id 查找 Agent 定义
export function getAgentById(agentId: string): AgentDefinition | undefined {
    return AGENT_REGISTRY.find((agent) => agent.id === agentId);
}

// 将注册表格式化为供 LLM 阅读的 Agent 目录文本
export function formatAgentsForPrompt(): string {
    return AGENT_REGISTRY.map((agent) => {
        const capabilityText = agent.capabilities.join("、");
        const keywordText = agent.keywords.join("、");
        return [
            `- id: ${agent.id}`,
            `  名称: ${agent.name}`,
            `  说明: ${agent.description}`,
            `  能力: ${capabilityText}`,
            `  关键词: ${keywordText}`,
        ].join("\n");
    }).join("\n\n");
}
