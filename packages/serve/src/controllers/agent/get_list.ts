import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { agentRouterService } from "../../services/agentRouter.js";
import { success } from "../../utils/response.js";

// 获取可路由 Agent 列表
export const handler = asyncHandler<AuthRequest>(async (_req, res) => {
    const agents = agentRouterService.listAgents();

    return success(res, { agents }, "获取 Agent 列表成功");
});
