import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { batchDeleteSeriesSchema, type BatchDeleteSeriesInput } from "../../validators/serie.js";
import { serieService } from "../../services/serie.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(batchDeleteSeriesSchema)];

// 批量删除项目分集（单条删除同样走此接口）
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId, serie_ids: serieIds } = req.body as BatchDeleteSeriesInput;
    const deletedSeries = await serieService.deleteSeries(req.user!.userId, projectId, serieIds);

    return success(res, deletedSeries, "分集删除成功");
});
