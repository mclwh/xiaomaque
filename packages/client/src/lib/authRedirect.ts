import { store } from "@/store";
import { logout } from "@/store/authSlice";

// UNAUTHORIZED_CODE 未授权业务码
const UNAUTHORIZED_CODE = 401;

// redirectingToLogin 是否正在跳转登录页（避免并发 401 重复跳转）
let redirectingToLogin = false;

// 401 时清除登录态并跳转登录页
export function redirectToLoginOnUnauthorized() {
    if (redirectingToLogin || window.location.pathname.startsWith("/login")) {
        return;
    }

    redirectingToLogin = true;
    store.dispatch(logout());

    const redirectUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.assign(`/login?redirect_url=${redirectUrl}`);
}

// 判断是否为未授权响应
export function isUnauthorizedResponse(httpStatus?: number, businessCode?: number) {
    return httpStatus === UNAUTHORIZED_CODE || businessCode === UNAUTHORIZED_CODE;
}
