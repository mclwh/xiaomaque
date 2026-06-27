import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import {
    generateEpisodeScriptSchema,
    type GenerateEpisodeScriptInput,
} from "../../validators/script.js";
import { episodeScriptService } from "../../services/episodeScript.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(generateEpisodeScriptSchema)];

// 为已有剧本生成全部分集正文并写入 serie_content
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId } = req.body as GenerateEpisodeScriptInput;
    const result = await episodeScriptService.generateEpisodes(req.user!.userId, projectId);

    return success(res, result, "分集剧本生成成功");
});
