import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { batchDeleteProjectsSchema, type BatchDeleteProjectsInput } from "../../validators/project.js";
import { projectService } from "../../services/project.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(batchDeleteProjectsSchema)];

// 批量删除项目（单条删除同样走此接口）
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_ids: projectIds } = req.body as BatchDeleteProjectsInput;
    const deletedProjects = await projectService.deleteProjects(req.user!.userId, projectIds);

    return success(res, deletedProjects, "项目删除成功");
});
