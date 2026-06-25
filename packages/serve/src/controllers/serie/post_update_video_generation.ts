import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import {
    updateSerieVideoGenerationSchema,
    type UpdateSerieVideoGenerationInput,
} from "../../validators/serie.js";
import { serieService } from "../../services/serie.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(updateSerieVideoGenerationSchema)];

// 保存项目分集视频生成参数
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const {
        project_id: projectId,
        serie_id: serieId,
        model_id: modelId,
        aspect_ratio: aspectRatio,
        resolution,
        video_style_id: videoStyleId,
    } = req.body as UpdateSerieVideoGenerationInput;

    const serie = await serieService.updateSerieVideoGeneration(req.user!.userId, projectId, serieId, {
        modelId,
        aspectRatio,
        resolution,
        ...(videoStyleId ? { videoStyleId } : {}),
    });

    return success(res, serie, "视频参数保存成功");
});
