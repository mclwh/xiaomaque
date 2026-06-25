import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { getProjectDetailSchema, type GetProjectDetailInput } from "../../validators/project.js";
import { projectService } from "../../services/project.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(getProjectDetailSchema, "query")];

// 获取项目详情（含是否存在剧情记录）
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId } = req.query as unknown as GetProjectDetailInput;
    const project = await projectService.getProjectDetail(req.user!.userId, projectId);

    return success(res, project, "获取项目详情成功");
});
