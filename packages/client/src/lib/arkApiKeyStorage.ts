// ARK_API_KEY_STORAGE_KEY localStorage 存储键（版本化）
const ARK_API_KEY_STORAGE_KEY = "arkApiKey:v1";

// ARK_API_KEY_HEADER 随 API 请求发送的火山方舟 Key 请求头
export const ARK_API_KEY_HEADER = "X-Ark-Api-Key";

// arkApiKeyCache 内存缓存，避免每次请求重复读取 localStorage
let arkApiKeyCache: string | null | undefined;

// 从 localStorage 读取用户配置的 ARK API Key
export function loadArkApiKey(): string {
    if (arkApiKeyCache !== undefined) {
        return arkApiKeyCache ?? "";
    }

    try {
        const stored = localStorage.getItem(ARK_API_KEY_STORAGE_KEY)?.trim() ?? "";
        arkApiKeyCache = stored || null;

        return stored;
    } catch {
        arkApiKeyCache = null;

        return "";
    }
}

// ARK_API_KEY_CHANGED_EVENT 本地 Key 变更时派发的全局事件名
export const ARK_API_KEY_CHANGED_EVENT = "xyq:ark-api-key-changed";

// 派发 ARK API Key 变更事件，供全局 Notice 等订阅
function dispatchArkApiKeyChanged() {
    if (typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(new Event(ARK_API_KEY_CHANGED_EVENT));
}

// 保存用户配置的 ARK API Key（空字符串表示清除）
export function saveArkApiKey(value: string): void {
    const trimmed = value.trim();

    try {
        if (trimmed) {
            localStorage.setItem(ARK_API_KEY_STORAGE_KEY, trimmed);
        } else {
            localStorage.removeItem(ARK_API_KEY_STORAGE_KEY);
        }
    } catch {
        // 隐私模式或配额不足时忽略
    }

    arkApiKeyCache = trimmed || null;
    dispatchArkApiKeyChanged();
}

// 清除用户配置的 ARK API Key
export function clearArkApiKey(): void {
    saveArkApiKey("");
}

// 判断用户是否已配置自定义 ARK API Key
export function hasCustomArkApiKey(): boolean {
    return loadArkApiKey().length > 0;
}
