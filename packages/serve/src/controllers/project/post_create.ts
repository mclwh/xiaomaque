import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { projectService } from "../../services/project.js";
import { success } from "../../utils/response.js";

// 静默新建短剧项目（无需请求体）
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const project = await projectService.createProject(req.user!.userId);

    return success(res, project, "项目创建成功");
});
