import axios, { type AxiosRequestConfig } from "axios";
import { ApiError, type ApiResponse } from "@/api/types";
import { ARK_API_KEY_HEADER, loadArkApiKey } from "@/lib/arkApiKeyStorage";
import { OPENAI_API_KEY_HEADER, loadOpenaiApiKey } from "@/lib/openaiApiKeyStorage";
import { isUnauthorizedResponse, redirectToLoginOnUnauthorized } from "@/lib/authRedirect";
import { attachRequestSignature } from "@/lib/requestSign";
import { store } from "@/store";

// API_BASE 后端接口地址（跨域直连，不再走 Vite 代理）
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// API_SIGN_SECRET 请求签名密钥，需与后端 API_SIGN_SECRET 保持一致
const API_SIGN_SECRET = import.meta.env.VITE_API_SIGN_SECRET;

// http axios 实例
export const http = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

// 从 axios 响应中解析业务 data，非 0 code 抛出 ApiError
function unwrapResponse<T>(payload: ApiResponse<T>): T {
    if (payload.code !== 0) {
        if (isUnauthorizedResponse(undefined, payload.code)) {
            redirectToLoginOnUnauthorized();
        }

        throw new ApiError(payload.code, payload.message, payload.errors);
    }

    return payload.data as T;
}

// 请求拦截：附加签名头并自动携带 Redux 中的 Bearer Token
http.interceptors.request.use(async (config) => {
    if (!API_SIGN_SECRET) {
        throw new Error("缺少 VITE_API_SIGN_SECRET 环境变量，无法发起 API 请求");
    }

    await attachRequestSignature(config, API_SIGN_SECRET);

    const token = store.getState().auth.token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const arkApiKey = loadArkApiKey();

    if (arkApiKey) {
        config.headers.set(ARK_API_KEY_HEADER, arkApiKey);
    }

    const openaiApiKey = loadOpenaiApiKey();

    if (openaiApiKey) {
        config.headers.set(OPENAI_API_KEY_HEADER, openaiApiKey);
    }

    return config;
});

// 响应拦截：统一处理业务错误码
http.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.data) {
            const payload = error.response.data as ApiResponse;
            const httpStatus = error.response.status;

            if (isUnauthorizedResponse(httpStatus, payload.code)) {
                redirectToLoginOnUnauthorized();

                throw new ApiError(
                    payload.code ?? httpStatus,
                    payload.message ?? "未授权",
                    payload.errors,
                );
            }

            if (typeof payload.code === "number") {
                throw new ApiError(payload.code, payload.message, payload.errors);
            }
        }

        throw error;
    },
);

// 发起 JSON API 请求
export async function request<T>(path: string, config: AxiosRequestConfig = {}): Promise<T> {
    const response = await http.request<ApiResponse<T>>({
        url: path,
        ...config,
    });

    return unwrapResponse(response.data);
}
