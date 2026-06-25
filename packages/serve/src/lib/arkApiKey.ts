import type { Request } from "express";
import { env } from "../config/env.js";

// ARK_API_KEY_HEADER 客户端可覆盖火山方舟 API Key 的请求头
export const ARK_API_KEY_HEADER = "x-ark-api-key";

// 从请求头读取客户端传入的 ARK API Key
export function readArkApiKeyHeader(value: string | string[] | undefined): string | undefined {
    const raw = Array.isArray(value) ? value[0] : value;
    const trimmed = raw?.trim();

    return trimmed || undefined;
}

// 从 Express 请求中读取客户端传入的 ARK API Key
export function readArkApiKeyFromRequest(req: Pick<Request, "headers">): string | undefined {
    return readArkApiKeyHeader(req.headers[ARK_API_KEY_HEADER]);
}

/**
 * 解析用于火山方舟调用的 API Key：优先使用客户端请求头，其次使用服务端环境变量
 * @param override 客户端传入的 Key（通常来自 X-Ark-Api-Key）
 */
export function resolveArkApiKey(override?: string): string {
    const key = override?.trim() || env.ARK_API_KEY?.trim();

    if (!key) {
        throw new Error("未配置 ARK_API_KEY");
    }

    return key;
}

// 判断服务端环境变量是否已配置 ARK API Key
export function isServerArkApiKeyConfigured(): boolean {
    return Boolean(env.ARK_API_KEY?.trim());
}
