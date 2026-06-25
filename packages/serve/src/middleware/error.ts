import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { fail, internalError } from "../utils/response.js";

/**
 * 全局错误处理中间件：按错误类型映射状态码
 * - AppError 子类：使用其携带的 code / httpStatus
 * - 其他异常：统一返回 500
 */
export function errorMiddleware(
    err: Error,
    _req: Request,
    res: Response,
    next: NextFunction,
) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof AppError) {
        return fail(res, err.code, err.message, {
            errors: err.errors,
            httpStatus: err.httpStatus,
        });
    }

    console.error("[Error]", err);

    return internalError(res, err.message || "服务器内部错误");
}
