import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { getSerieDetailSchema, type GetSerieDetailInput } from "../../validators/serie.js";
import { serieService } from "../../services/serie.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(getSerieDetailSchema, "query")];

// 查询单个分集详情
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId, serie_id: serieId } = req.query as unknown as GetSerieDetailInput;
    const serie = await serieService.getSerieDetail(req.user!.userId, projectId, serieId);

    return success(res, serie, "获取分集详情成功");
});
