import type { Response } from "express";
import type { AuthRequest } from "../../middleware/jwt.js";
import { isServerOpenaiApiKeyConfigured } from "../../lib/openaiApiKey.js";
import { success } from "../../utils/response.js";

// 返回服务端是否已配置 OpenAI API Key（不暴露具体 Key）
export async function handler(_req: AuthRequest, res: Response) {
    return success(
        res,
        {
            configured: isServerOpenaiApiKeyConfigured(),
        },
        "ok",
    );
}
