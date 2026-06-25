import { ApiError } from "@/api/types";

// 从异常中解析 API 错误文案
export function getApiErrorMessage(error: unknown, fallback: string) {
    return error instanceof ApiError ? error.message : fallback;
}
