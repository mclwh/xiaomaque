import { ResponseCode } from "../utils/response.js";

/**
 * 业务错误基类：携带业务 code 与 HTTP 状态码，供全局错误中间件统一映射响应
 * 业务层抛出其子类（如 NotFoundError），控制器无需再用字符串匹配判断状态码
 */
export class AppError extends Error {
    /* code 业务响应码（与 HTTP 状态码对齐） */
    readonly code: number;
    /* httpStatus 实际返回的 HTTP 状态码 */
    readonly httpStatus: number;
    /* errors 附加的字段级错误信息 */
    readonly errors?: unknown;

    constructor(
        message: string,
        options: { code: number; httpStatus?: number; errors?: unknown },
    ) {
        super(message);
        this.name = new.target.name;
        this.code = options.code;
        this.httpStatus = options.httpStatus ?? options.code;
        this.errors = options.errors;
    }
}

// 400 请求参数错误
export class BadRequestError extends AppError {
    constructor(message: string, errors?: unknown) {
        super(message, { code: ResponseCode.BAD_REQUEST, errors });
    }
}

// 401 未授权
export class UnauthorizedError extends AppError {
    constructor(message = "未授权") {
        super(message, { code: ResponseCode.UNAUTHORIZED });
    }
}

// 403 禁止访问
export class ForbiddenError extends AppError {
    constructor(message = "禁止访问") {
        super(message, { code: ResponseCode.FORBIDDEN });
    }
}

// 404 资源不存在
export class NotFoundError extends AppError {
    constructor(message = "资源不存在") {
        super(message, { code: ResponseCode.NOT_FOUND });
    }
}
