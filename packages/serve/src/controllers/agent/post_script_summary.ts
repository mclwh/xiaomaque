import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import {
    generateScriptSummarySchema,
    type GenerateScriptSummaryInput,
} from "../../validators/script.js";
import { scriptSummaryService } from "../../services/scriptSummary.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(generateScriptSummarySchema)];

// 为已有剧本草稿生成摘要并写回 summary 字段
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId } = req.body as GenerateScriptSummaryInput;
    const result = await scriptSummaryService.generateSummary(req.user!.userId, projectId);

    return success(res, result, "剧本摘要生成成功");
});
