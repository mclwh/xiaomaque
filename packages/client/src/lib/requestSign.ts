import type { InternalAxiosRequestConfig } from "axios";

// SIGN_HEADERS 签名相关请求头字段名
const SIGN_HEADERS = {
    timestamp: "X-Timestamp",
    nonce: "X-Nonce",
    signature: "X-Signature",
} as const;

// 生成随机 nonce，用于防止重放攻击
function generateNonce(): string {
    return crypto.randomUUID();
}

// 计算字符串的 SHA-256 十六进制摘要
async function sha256Hex(value: string): Promise<string> {
    const encoded = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", encoded);

    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

// 使用 HMAC-SHA256 计算签名并返回十六进制字符串
async function hmacSha256Hex(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));

    return Array.from(new Uint8Array(signature))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

// 解析请求路径（含 /api 前缀），与后端 originalUrl 保持一致
function getRequestPath(config: InternalAxiosRequestConfig): string {
    const baseURL = config.baseURL ?? "";
    const url = config.url ?? "";
    const urlPath = url.split("?")[0].split("#")[0];

    if (urlPath.startsWith("http://") || urlPath.startsWith("https://")) {
        return new URL(urlPath).pathname;
    }

    if (!baseURL) {
        return urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
    }

    try {
        const base = new URL(baseURL);
        const basePath = base.pathname.replace(/\/$/, "");
        const normalizedUrl = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
        const joined = `${basePath}${normalizedUrl}`.replace(/\/+/g, "/");

        return joined.startsWith("/") ? joined : `/${joined}`;
    } catch {
        return urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
    }
}

// 获取与 axios 实际发送一致的请求体字符串
function getRequestBody(config: InternalAxiosRequestConfig): string {
    if (config.data === undefined || config.data === null) {
        return "";
    }

    if (typeof config.data === "string") {
        return config.data;
    }

    return JSON.stringify(config.data);
}

// 构建待签名的规范化字符串
async function buildCanonicalString(
    method: string,
    path: string,
    timestamp: string,
    nonce: string,
    body: string,
): Promise<string> {
    const bodyHash = await sha256Hex(body);

    return [method.toUpperCase(), path, timestamp, nonce, bodyHash].join("\n");
}

/**
 * 为 axios 请求附加签名头：X-Timestamp、X-Nonce、X-Signature
 * @param config axios 请求配置
 * @param secret API 签名密钥
 */
export async function attachRequestSignature(
    config: InternalAxiosRequestConfig,
    secret: string,
): Promise<InternalAxiosRequestConfig> {
    const timestamp = Date.now().toString();
    const nonce = generateNonce();
    const method = config.method ?? "get";
    const path = getRequestPath(config);
    const body = getRequestBody(config);
    const canonical = await buildCanonicalString(method, path, timestamp, nonce, body);
    const signature = await hmacSha256Hex(canonical, secret);

    config.headers.set(SIGN_HEADERS.timestamp, timestamp);
    config.headers.set(SIGN_HEADERS.nonce, nonce);
    config.headers.set(SIGN_HEADERS.signature, signature);

    return config;
}
