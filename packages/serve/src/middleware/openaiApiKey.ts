import type { Request, Response, NextFunction } from "express";
import { readOpenaiApiKeyFromRequest } from "../lib/openaiApiKey.js";
import { runWithOpenaiApiKeyContext } from "../lib/requestOpenaiApiKeyContext.js";

// 将客户端传入的 OpenAI API Key 注入当前请求上下文
export function openaiApiKeyMiddleware(req: Request, _res: Response, next: NextFunction) {
    const openaiApiKey = readOpenaiApiKeyFromRequest(req);

    runWithOpenaiApiKeyContext(openaiApiKey, () => {
        next();
    });
}
