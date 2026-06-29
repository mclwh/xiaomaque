// OPENAI_API_KEY_STORAGE_KEY localStorage 存储键（版本化）
const OPENAI_API_KEY_STORAGE_KEY = "openaiApiKey:v1";

// OPENAI_API_KEY_HEADER 随 API 请求发送的 OpenAI Key 请求头
export const OPENAI_API_KEY_HEADER = "X-Openai-Api-Key";

// openaiApiKeyCache 内存缓存，避免每次请求重复读取 localStorage
let openaiApiKeyCache: string | null | undefined;

// 从 localStorage 读取用户配置的 OpenAI API Key
export function loadOpenaiApiKey(): string {
    if (openaiApiKeyCache !== undefined) {
        return openaiApiKeyCache ?? "";
    }

    try {
        const stored = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY)?.trim() ?? "";
        openaiApiKeyCache = stored || null;

        return stored;
    } catch {
        openaiApiKeyCache = null;

        return "";
    }
}

// OPENAI_API_KEY_CHANGED_EVENT 本地 Key 变更时派发的全局事件名
export const OPENAI_API_KEY_CHANGED_EVENT = "xyq:openai-api-key-changed";

// 派发 OpenAI API Key 变更事件
function dispatchOpenaiApiKeyChanged() {
    if (typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(new Event(OPENAI_API_KEY_CHANGED_EVENT));
}

// 保存用户配置的 OpenAI API Key（空字符串表示清除）
export function saveOpenaiApiKey(value: string): void {
    const trimmed = value.trim();

    try {
        if (trimmed) {
            localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, trimmed);
        } else {
            localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
        }
    } catch {
        // 隐私模式或配额不足时忽略
    }

    openaiApiKeyCache = trimmed || null;
    dispatchOpenaiApiKeyChanged();
}

// 清除用户配置的 OpenAI API Key
export function clearOpenaiApiKey(): void {
    saveOpenaiApiKey("");
}

// 判断用户是否已配置自定义 OpenAI API Key
export function hasCustomOpenaiApiKey(): boolean {
    return loadOpenaiApiKey().length > 0;
}
