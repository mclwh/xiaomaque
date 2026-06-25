import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { forbidden } from "../utils/response.js";
import {
    SIGN_HEADERS,
    buildCanonicalString,
    hmacSha256Hex,
    isTimestampValid,
    verifySignature,
} from "../utils/requestSign.js";

// SignedRequest 携带原始请求体的 Express 请求类型
export interface SignedRequest extends Request {
    rawBody?: string;
}

// nonceCache 已使用的 nonce 缓存，用于防止重放
const nonceCache = new Map<string, number>();

// 清理过期的 nonce 记录
function cleanupNonceCache(now: number): void {
    for (const [nonce, expiresAt] of nonceCache.entries()) {
        if (expiresAt <= now) {
            nonceCache.delete(nonce);
        }
    }
}

// 判断 nonce 是否已被使用
function isNonceReplayed(nonce: string, now: number): boolean {
    cleanupNonceCache(now);
    return nonceCache.has(nonce);
}

// 记录已使用的 nonce
function rememberNonce(nonce: string, now: number): void {
    nonceCache.set(nonce, now + env.API_SIGN_NONCE_TTL_MS);
}

// 从请求头读取签名相关字段（Express 会将头名转为小写）
function readSignHeaders(req: Request): {
    timestamp?: string;
    nonce?: string;
    signature?: string;
} {
    return {
        timestamp: req.headers[SIGN_HEADERS.timestamp] as string | undefined,
        nonce: req.headers[SIGN_HEADERS.nonce] as string | undefined,
        signature: req.headers[SIGN_HEADERS.signature] as string | undefined,
    };
}

/**
 * 请求签名校验中间件：校验 X-Timestamp、X-Nonce、X-Signature
 * 需在 express.json 之后挂载，以便读取 rawBody
 */
export function signatureMiddleware(
    req: SignedRequest,
    res: Response,
    next: NextFunction,
) {
    const { timestamp, nonce, signature } = readSignHeaders(req);

    if (!timestamp || !nonce || !signature) {
        forbidden(res, "缺少请求签名头");
        return;
    }

    if (!isTimestampValid(timestamp)) {
        forbidden(res, "请求签名已过期");
        return;
    }

    const now = Date.now();

    if (isNonceReplayed(nonce, now)) {
        forbidden(res, "请求签名无效");
        return;
    }

    const path = req.originalUrl.split("?")[0];
    const body = req.rawBody ?? "";
    const canonical = buildCanonicalString(req.method, path, timestamp, nonce, body);
    const expected = hmacSha256Hex(canonical, env.API_SIGN_SECRET);

    if (!verifySignature(signature, expected)) {
        forbidden(res, "请求签名校验失败");
        return;
    }

    rememberNonce(nonce, now);
    next();
}
