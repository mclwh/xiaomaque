import { request } from "@/api/http";
import type { RequestOptions } from "@/api/types";
import type { AuthUser } from "@/store/types/auth";

// LoginResult 登录接口返回
export type LoginResult = {
    user: AuthUser;
    token: string;
    isNewUser: boolean;
};

// 手机号登录
export function loginWithPhone(phone: string) {
    return request<LoginResult>("/auth/login", {
        method: "POST",
        data: { phone },
    });
}

// 获取当前登录用户信息
export function fetchProfile(options?: RequestOptions) {
    return request<AuthUser>("/auth/profile", {
        method: "GET",
        signal: options?.signal,
    });
}
