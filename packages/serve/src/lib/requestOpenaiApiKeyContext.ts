import { AsyncLocalStorage } from "node:async_hooks";

// OpenaiApiKeyContext 单次请求内的 OpenAI Key 覆盖上下文
type OpenaiApiKeyContext = {
    openaiApiKey?: string;
};

// openaiApiKeyStorage 请求级 OpenAI Key 异步上下文
const openaiApiKeyStorage = new AsyncLocalStorage<OpenaiApiKeyContext>();

/**
 * 在指定 OpenAI Key 上下文中执行回调（供中间件注入客户端 Key）
 * @param openaiApiKey 客户端传入的 Key 覆盖值
 * @param fn 需要在上下文中执行的函数
 */
export function runWithOpenaiApiKeyContext<T>(openaiApiKey: string | undefined, fn: () => T): T {
    return openaiApiKeyStorage.run({ openaiApiKey }, fn);
}

// 读取当前请求上下文中的 OpenAI Key 覆盖值
export function getRequestOpenaiApiKeyOverride(): string | undefined {
    return openaiApiKeyStorage.getStore()?.openaiApiKey;
}
