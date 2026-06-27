import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { agentRouteSchema, type AgentRouteInput } from "../../validators/agent.js";
import { agentRouterService } from "../../services/agentRouter.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(agentRouteSchema)];

// Agent 智能路由：根据用户描述选择最匹配的 Agent
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { query } = req.body as AgentRouteInput;
    const result = await agentRouterService.route(query);

    return success(res, result, "路由成功");
});
