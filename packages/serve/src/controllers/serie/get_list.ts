import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { listSeriesSchema, type ListSeriesInput } from "../../validators/serie.js";
import { serieService } from "../../services/serie.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(listSeriesSchema, "query")];

// 查询项目集数列表
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId } = req.query as unknown as ListSeriesInput;
    const series = await serieService.listByProject(req.user!.userId, projectId);

    return success(res, series, "获取集数列表成功");
});
