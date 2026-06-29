import type { Request } from "express";
import { env } from "../config/env.js";

// OPENAI_API_KEY_HEADER 客户端可覆盖 OpenAI API Key 的请求头
export const OPENAI_API_KEY_HEADER = "x-openai-api-key";

// 从请求头读取客户端传入的 OpenAI API Key
export function readOpenaiApiKeyHeader(value: string | string[] | undefined): string | undefined {
    const raw = Array.isArray(value) ? value[0] : value;
    const trimmed = raw?.trim();

    return trimmed || undefined;
}

// 从 Express 请求中读取客户端传入的 OpenAI API Key
export function readOpenaiApiKeyFromRequest(req: Pick<Request, "headers">): string | undefined {
    return readOpenaiApiKeyHeader(req.headers[OPENAI_API_KEY_HEADER]);
}

/**
 * 解析用于 LLM 调用的 API Key：优先使用客户端请求头，其次使用服务端环境变量
 * @param override 客户端传入的 Key（通常来自 X-Openai-Api-Key）
 */
export function resolveOpenaiApiKey(override?: string): string {
    const key = override?.trim() || env.OPENAI_API_KEY?.trim();

    if (!key) {
        throw new Error("未配置 OPENAI_API_KEY");
    }

    return key;
}

// 判断当前请求上下文是否可用 OpenAI API Key（客户端或服务端至少一方已配置）
export function isOpenaiApiKeyAvailable(override?: string): boolean {
    return Boolean(override?.trim() || env.OPENAI_API_KEY?.trim());
}

// 判断服务端环境变量是否已配置 OpenAI API Key
export function isServerOpenaiApiKeyConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY?.trim());
}
