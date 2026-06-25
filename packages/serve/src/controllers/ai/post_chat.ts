import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { chatSchema, type ChatInput } from "../../validators/ai.js";
import { aiService } from "../../services/ai.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(chatSchema)];

// AI 对话
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { message } = req.body as ChatInput;
    const reply = await aiService.chat(message);

    return success(res, { reply }, "对话成功");
});
