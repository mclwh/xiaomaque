import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import {
    createScriptDraftSchema,
    type CreateScriptDraftInput,
} from "../../validators/script.js";
import { scriptSummaryService } from "../../services/scriptSummary.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(createScriptDraftSchema)];

// 创建剧本草稿：立即新建 project 与 script，原始创意写入 source
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const body = req.body as CreateScriptDraftInput;
    const result = await scriptSummaryService.createDraft(req.user!.userId, {
        creative: body.creative,
        episodeCount: body.episodeCount,
        imageStyleId: body.imageStyleId,
    });

    return success(res, result, "剧本草稿创建成功");
});
