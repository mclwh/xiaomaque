import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { isOpenaiApiKeyAvailable } from "../lib/openaiApiKey.js";
import { getRequestOpenaiApiKeyOverride } from "../lib/requestOpenaiApiKeyContext.js";
import { createChatModel } from "./llm.js";
import { AGENT_REGISTRY, formatAgentsForPrompt, getAgentById } from "./registry.js";
import type { AgentRouteResult } from "./types.js";

/**
 * Agent 智能路由：基于 LangChain 结构化输出，根据用户描述选择最匹配的 Agent
 */

// routeDecisionSchema LLM 路由决策的结构化输出模式
const routeDecisionSchema = z.object({
    agentId: z
        .string()
        .describe("最匹配的 Agent id，必须是候选列表中已存在的 id"),
    confidence: z
        .number()
        .min(0)
        .max(1)
        .describe("匹配置信度，0 到 1 之间"),
    reason: z.string().describe("选择该 Agent 的简要理由，面向用户可读"),
    alternatives: z
        .array(
            z.object({
                agentId: z.string().describe("备选 Agent id"),
                score: z
                    .number()
                    .min(0)
                    .max(1)
                    .describe("备选匹配分数"),
                reason: z.string().describe("推荐为备选的理由"),
            }),
        )
        .max(2)
        .describe("最多 2 个备选 Agent，按分数降序"),
});

// RouteDecision LLM 路由决策类型
type RouteDecision = z.infer<typeof routeDecisionSchema>;

// ROUTER_SYSTEM_PROMPT 路由 Agent 的系统提示词
const ROUTER_SYSTEM_PROMPT = `你是小麻雀平台的 Agent 智能路由助手。根据用户的描述和需求，从候选 Agent 列表中选择最合适的一个。

强制规则：
1. 只返回候选列表中存在的 agentId，不要编造新的 id
2. confidence 应反映匹配程度：明确对应该 Agent 核心场景时给 0.85 以上，模糊或跨场景时给 0.5–0.75
3. reason 用简洁中文说明为何选择该 Agent，不超过 80 字
4. alternatives 列出其他可能合适的 Agent（最多 2 个），无合适备选时返回空数组
5. 若用户需求同时涉及多个场景，选择用户主要目标对应的 Agent

候选 Agent 列表：
${formatAgentsForPrompt()}`;

// 创建用于路由的 ChatOpenAI 模型实例
function createRouterModel(): ChatOpenAI {
    return createChatModel(0.2);
}

// 将 LLM 决策与注册表合并为完整路由结果
function buildRouteResult(decision: RouteDecision): AgentRouteResult {
    const matched = getAgentById(decision.agentId);

    if (!matched) {
        throw new Error(`路由结果包含未知 Agent: ${decision.agentId}`);
    }

    return {
        agentId: matched.id,
        agentName: matched.name,
        routePath: matched.routePath,
        confidence: decision.confidence,
        reason: decision.reason,
        alternatives: decision.alternatives
            .map((alt) => {
                const agent = getAgentById(alt.agentId);
                if (!agent) {
                    return null;
                }

                return {
                    agentId: agent.id,
                    agentName: agent.name,
                    score: alt.score,
                    reason: alt.reason,
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null),
    };
}

// 校验注册表是否已配置 Agent
function assertRegistryNotEmpty(): void {
    if (AGENT_REGISTRY.length === 0) {
        throw new Error("暂无可路由的 Agent，请先在 AGENT_REGISTRY 中注册");
    }
}

// 基于关键词的简单回退路由（无 API Key 或 LLM 失败时使用）
function fallbackRouteByKeywords(query: string): AgentRouteResult {
    assertRegistryNotEmpty();

    const normalized = query.toLowerCase();
    let bestAgent = AGENT_REGISTRY[0];
    let bestScore = 0;

    for (const agent of AGENT_REGISTRY) {
        const score = agent.keywords.reduce((total, keyword) => {
            return normalized.includes(keyword.toLowerCase()) ? total + 1 : total;
        }, 0);

        if (score > bestScore) {
            bestScore = score;
            bestAgent = agent;
        }
    }

    const confidence = bestScore > 0 ? Math.min(0.5 + bestScore * 0.15, 0.85) : 0.4;

    return {
        agentId: bestAgent.id,
        agentName: bestAgent.name,
        routePath: bestAgent.routePath,
        confidence,
        reason:
            bestScore > 0
                ? `根据关键词匹配到「${bestAgent.name}」`
                : `未能明确识别需求，默认推荐「${bestAgent.name}」`,
        alternatives: AGENT_REGISTRY.filter((agent) => agent.id !== bestAgent.id)
            .slice(0, 2)
            .map((agent) => ({
                agentId: agent.id,
                agentName: agent.name,
                score: 0.3,
                reason: `可作为备选：${agent.description.slice(0, 40)}…`,
            })),
    };
}

/**
 * 根据用户描述路由到最匹配的 Agent
 * @param query 用户的描述或需求文本
 * @returns 路由决策结果
 */
export async function routeToAgent(query: string): Promise<AgentRouteResult> {
    const trimmed = query.trim();

    if (!trimmed) {
        throw new Error("路由查询不能为空");
    }

    assertRegistryNotEmpty();

    if (!isOpenaiApiKeyAvailable(getRequestOpenaiApiKeyOverride())) {
        return fallbackRouteByKeywords(trimmed);
    }

    try {
        const model = createRouterModel();
        const structuredModel = model.withStructuredOutput(routeDecisionSchema, {
            name: "agent_route_decision",
        });

        const decision = await structuredModel.invoke([
            new SystemMessage(ROUTER_SYSTEM_PROMPT),
            new HumanMessage(`用户需求：\n${trimmed}`),
        ]);

        return buildRouteResult(decision);
    } catch {
        return fallbackRouteByKeywords(trimmed);
    }
}
