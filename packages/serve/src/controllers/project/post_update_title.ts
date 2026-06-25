import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { updateProjectTitleSchema, type UpdateProjectTitleInput } from "../../validators/project.js";
import { projectService } from "../../services/project.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(updateProjectTitleSchema)];

// 重命名项目
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId, title } = req.body as UpdateProjectTitleInput;
    const project = await projectService.updateProjectTitle(req.user!.userId, projectId, title);

    return success(res, project, "项目重命名成功");
});
