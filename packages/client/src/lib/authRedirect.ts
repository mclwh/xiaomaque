import { store } from "@/store";
import { logout } from "@/store/authSlice";

// UNAUTHORIZED_CODE 未授权业务码
const UNAUTHORIZED_CODE = 401;

// redirectingToLogin 是否正在跳转登录页（避免并发 401 重复跳转）
let redirectingToLogin = false;

// 从 Hash 路由解析当前 pathname（如 #/novel → /novel）
function getHashPathname(): string {
    const hash = window.location.hash.replace(/^#/, "");
    const pathname = hash.split("?")[0];

    return pathname || "/";
}

// 从 Hash 路由解析当前 search（如 #/novel?tab=1 → ?tab=1）
function getHashSearch(): string {
    const hash = window.location.hash.replace(/^#/, "");
    const queryIndex = hash.indexOf("?");

    return queryIndex >= 0 ? hash.slice(queryIndex) : "";
}

// 401 时清除登录态并跳转登录页
export function redirectToLoginOnUnauthorized() {
    const currentPath = getHashPathname();

    if (redirectingToLogin || currentPath.startsWith("/login")) {
        return;
    }

    redirectingToLogin = true;
    store.dispatch(logout());

    const redirectUrl = encodeURIComponent(`${currentPath}${getHashSearch()}`);
    window.location.replace(`${window.location.pathname}${window.location.search}#/login?redirect_url=${redirectUrl}`);
}

// 判断是否为未授权响应
export function isUnauthorizedResponse(httpStatus?: number, businessCode?: number) {
    return httpStatus === UNAUTHORIZED_CODE || businessCode === UNAUTHORIZED_CODE;
}
