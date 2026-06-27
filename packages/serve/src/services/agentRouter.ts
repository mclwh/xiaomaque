import { AGENT_REGISTRY } from "../agents/registry.js";
import { routeToAgent } from "../agents/router.js";
import type { AgentDefinition, AgentRouteResult } from "../agents/types.js";

/**
 * Agent 路由服务：对外提供 Agent 列表查询与智能路由能力
 */
export class AgentRouterService {
    // 返回全部可路由 Agent 的元数据
    listAgents(): AgentDefinition[] {
        return AGENT_REGISTRY;
    }

    // 根据用户描述选择最匹配的 Agent
    async route(query: string): Promise<AgentRouteResult> {
        return routeToAgent(query);
    }
}

// agentRouterService Agent 路由服务单例
export const agentRouterService = new AgentRouterService();
