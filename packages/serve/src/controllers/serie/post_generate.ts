import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { readArkApiKeyFromRequest } from "../../lib/arkApiKey.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { buildSeedanceGenerateBody } from "../../lib/buildSeedanceGenerateBody.js";
import { listSerieFragmentReferenceAssetsByFragmentId } from "../../services/serieFragment.js";
import { submitSerieFragmentSeedanceTask } from "../../services/serieGeneration.js";
import { generateSerieSchema, type GenerateSerieInput } from "../../validators/serie.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(generateSerieSchema)];

// 提交分镜 Seedance 视频生成任务
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const {
        project_id: projectId,
        serie_id: serieId,
        fragment_id: fragmentId,
        content,
        model_id: modelId,
        aspect_ratio: aspectRatio,
        resolution,
        video_style_id: videoStyleId,
    } = req.body as GenerateSerieInput;

    const reference = await listSerieFragmentReferenceAssetsByFragmentId(fragmentId);
    const seedanceBody = buildSeedanceGenerateBody({
        content,
        reference,
        model_id: modelId,
        aspect_ratio: aspectRatio,
        resolution,
        video_style_id: videoStyleId,
    });

    const arkApiKey = readArkApiKeyFromRequest(req);
    const result = await submitSerieFragmentSeedanceTask(
        req.user!.userId,
        projectId,
        serieId,
        fragmentId,
        seedanceBody,
        arkApiKey,
    );

    return success(res, result, "生成任务已提交");
});
