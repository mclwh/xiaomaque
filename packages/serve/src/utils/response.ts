import type { Response } from "express";

/** 业务响应码：0 表示成功，其余与 HTTP 状态码对齐 */
export const ResponseCode = {
    SUCCESS: 0,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
} as const;

export type ApiResponse<T = unknown> = {
    code: number;
    message: string;
    data?: T;
    errors?: unknown;
};

// 成功响应，code 固定为 0
export function success<T>(res: Response, data: T, message = "success") {
    const body: ApiResponse<T> = {
        code: ResponseCode.SUCCESS,
        message,
        data,
    };
    return res.json(body);
}

// 通用错误响应
export function fail(
    res: Response,
    code: number,
    message: string,
    options?: { errors?: unknown; httpStatus?: number },
) {
    const httpStatus = options?.httpStatus ?? code;
    const body: ApiResponse = { code, message };

    if (options?.errors !== undefined) {
        body.errors = options.errors;
    }

    return res.status(httpStatus).json(body);
}

// 400 请求参数错误
export function badRequest(res: Response, message: string, errors?: unknown) {
    return fail(res, ResponseCode.BAD_REQUEST, message, { errors });
}

// 401 未授权
export function unauthorized(res: Response, message = "未授权") {
    return fail(res, ResponseCode.UNAUTHORIZED, message);
}

// 403 禁止访问
export function forbidden(res: Response, message = "禁止访问") {
    return fail(res, ResponseCode.FORBIDDEN, message);
}

// 404 资源不存在
export function notFound(res: Response, message = "资源不存在") {
    return fail(res, ResponseCode.NOT_FOUND, message);
}

// 500 服务器内部错误
export function internalError(res: Response, message = "服务器内部错误") {
    return fail(res, ResponseCode.INTERNAL_ERROR, message);
}
