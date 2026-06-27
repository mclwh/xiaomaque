import { z } from "zod";

// agentRouteSchema Agent 智能路由请求参数校验
export const agentRouteSchema = z.object({
    query: z.string().min(1, "描述不能为空").max(2000, "描述不能超过 2000 字"),
});

// AgentRouteInput Agent 路由请求参数类型
export type AgentRouteInput = z.infer<typeof agentRouteSchema>;
