import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import {
    getScriptDetailSchema,
    type GetScriptDetailInput,
} from "../../validators/script.js";
import { scriptService } from "../../services/script.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(getScriptDetailSchema, "query")];

// 获取项目关联的剧本详情
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId } = req.query as unknown as GetScriptDetailInput;
    const script = await scriptService.getByProjectId(req.user!.userId, projectId);

    return success(res, script, "获取剧本详情成功");
});
