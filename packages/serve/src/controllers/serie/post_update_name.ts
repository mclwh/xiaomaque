import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { updateSerieNameSchema, type UpdateSerieNameInput } from "../../validators/serie.js";
import { serieService } from "../../services/serie.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(updateSerieNameSchema)];

// 重命名项目分集
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId, serie_id: serieId, subtitle } = req.body as UpdateSerieNameInput;
    const serie = await serieService.updateSerieSubtitle(
        req.user!.userId,
        projectId,
        serieId,
        subtitle,
    );

    return success(res, serie, "分集重命名成功");
});
