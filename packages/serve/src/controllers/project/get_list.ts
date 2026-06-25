import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { listRecentProjectsSchema, type ListRecentProjectsInput } from "../../validators/project.js";
import { projectService } from "../../services/project.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(listRecentProjectsSchema, "query")];

// 获取当前用户最近更新的项目列表
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { limit } = req.query as unknown as ListRecentProjectsInput;
    const projects = await projectService.listRecentByUser(req.user!.userId, limit);

    return success(res, projects, "获取最近项目列表成功");
});
