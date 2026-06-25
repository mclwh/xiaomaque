// 与后端统一的 API 响应结构
export type ApiResponse<T = unknown> = {
    code: number;
    message: string;
    data?: T;
    errors?: unknown;
};

// API 业务错误
export class ApiError extends Error {
    code: number;
    errors?: unknown;

    constructor(code: number, message: string, errors?: unknown) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.errors = errors;
    }
}

// RequestOptions 可选请求配置（如 AbortSignal）
export type RequestOptions = {
    signal?: AbortSignal;
};
