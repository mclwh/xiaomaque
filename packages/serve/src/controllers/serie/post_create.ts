import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { createSerieSchema, type CreateSerieInput } from "../../validators/serie.js";
import { serieService } from "../../services/serie.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(createSerieSchema)];

// 新建项目分集
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId, name, params } = req.body as CreateSerieInput;
    const serie = await serieService.createSerie(req.user!.userId, projectId, name, params);

    return success(res, serie, "分集创建成功");
});
