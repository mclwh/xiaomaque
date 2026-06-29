import { request } from "@/api/http";

// ArkApiKeyStatus 服务端 ARK API Key 配置状态
export type ArkApiKeyStatus = {
    configured: boolean;
};

// OpenaiApiKeyStatus 服务端 OpenAI API Key 配置状态
export type OpenaiApiKeyStatus = {
    configured: boolean;
};

// 查询服务端是否已配置 ARK API Key
export function fetchArkApiKeyStatus(signal?: AbortSignal) {
    return request<ArkApiKeyStatus>("/config/ark_key", {
        method: "GET",
        signal,
    });
}

// 查询服务端是否已配置 OpenAI API Key
export function fetchOpenaiApiKeyStatus(signal?: AbortSignal) {
    return request<OpenaiApiKeyStatus>("/config/openai_key", {
        method: "GET",
        signal,
    });
}
