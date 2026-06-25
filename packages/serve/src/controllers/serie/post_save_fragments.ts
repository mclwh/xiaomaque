import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { updateSerieFragmentsSchema, type UpdateSerieFragmentsInput } from "../../validators/serie.js";
import { serieService } from "../../services/serie.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(updateSerieFragmentsSchema)];

// 保存项目分集 fragments
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId, serie_id: serieId, fragments } = req.body as UpdateSerieFragmentsInput;
    const serie = await serieService.updateSerieFragments(
        req.user!.userId,
        projectId,
        serieId,
        fragments,
    );

    return success(res, serie, "分镜保存成功");
});
