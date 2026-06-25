import { createHmac, createHash, timingSafeEqual } from "node:crypto";

// SIGN_HEADERS 签名相关请求头字段名
export const SIGN_HEADERS = {
    timestamp: "x-timestamp",
    nonce: "x-nonce",
    signature: "x-signature",
} as const;

// TIMESTAMP_TOLERANCE_MS 允许的时间戳偏差（5 分钟）
export const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

// 计算字符串的 SHA-256 十六进制摘要
export function sha256Hex(value: string): string {
    return createHash("sha256").update(value).digest("hex");
}

// 使用 HMAC-SHA256 计算签名并返回十六进制字符串
export function hmacSha256Hex(message: string, secret: string): string {
    return createHmac("sha256", secret).update(message).digest("hex");
}

// 构建待签名的规范化字符串
export function buildCanonicalString(
    method: string,
    path: string,
    timestamp: string,
    nonce: string,
    body: string,
): string {
    const bodyHash = sha256Hex(body);

    return [method.toUpperCase(), path, timestamp, nonce, bodyHash].join("\n");
}

// 校验客户端签名与服务端重算结果是否一致
export function verifySignature(expected: string, actual: string): boolean {
    const expectedBuffer = Buffer.from(expected, "hex");
    const actualBuffer = Buffer.from(actual, "hex");

    if (expectedBuffer.length !== actualBuffer.length) {
        return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
}

// 校验时间戳是否在允许的时间窗口内
export function isTimestampValid(timestamp: string, now = Date.now()): boolean {
    const parsed = Number(timestamp);

    if (!Number.isFinite(parsed)) {
        return false;
    }

    return Math.abs(now - parsed) <= TIMESTAMP_TOLERANCE_MS;
}
