import { env } from "../config/env.js";
import { resolveArkApiKey } from "./arkApiKey.js";

// ArkErrorPayload 火山方舟错误响应结构
type ArkErrorPayload = {
    error?: {
        message?: string;
        code?: string;
    };
};

/**
 * 解析火山方舟 API 错误信息：优先取 error.message，其次原始字符串，最后回退到通用文案
 * @param payload 响应体（已解析或原始字符串）
 * @param status HTTP 状态码
 * @param label 业务标识（如 Seedance / Seedream），用于回退文案
 */
export function parseArkApiError(payload: unknown, status: number, label: string): string {
    if (payload && typeof payload === "object") {
        const errorPayload = payload as ArkErrorPayload;

        if (errorPayload.error?.message) {
            return errorPayload.error.message;
        }
    }

    if (typeof payload === "string" && payload.trim()) {
        return payload;
    }

    return `${label} 请求失败（HTTP ${status}）`;
}

/**
 * 调用火山方舟 API：自动拼接 base url 与 Authorization 头
 * @param path 相对 ARK_BASE_URL 的路径（以 / 开头）
 * @param init fetch 选项
 * @param apiKeyOverride 客户端传入的 Key（优先于服务端环境变量）
 */
export async function arkFetch(
    path: string,
    init: RequestInit = {},
    apiKeyOverride?: string,
): Promise<Response> {
    const apiKey = resolveArkApiKey(apiKeyOverride);

    return fetch(`${env.ARK_BASE_URL}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            ...(init.headers ?? {}),
        },
    });
}
