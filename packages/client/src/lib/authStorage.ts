// 登录态 localStorage 持久化
import type { AuthState } from "@/store/types/auth";

// AUTH_STORAGE_KEY 登录态存储键名（带版本前缀）
const AUTH_STORAGE_KEY = "authSession:v1";

// PersistedAuthSession 可持久化的登录态字段
type PersistedAuthSession = Pick<AuthState, "token" | "user">;

// 从 localStorage 读取登录态
export function loadAuthSession(): PersistedAuthSession | null {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as PersistedAuthSession;
        if (!parsed.token || !parsed.user?.id) {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

// 将登录态写入 localStorage
export function saveAuthSession(session: PersistedAuthSession): void {
    try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch {
        // 隐私模式或配额不足时忽略
    }
}

// 清除 localStorage 中的登录态
export function clearAuthSession(): void {
    try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
        // 忽略清除失败
    }
}
