import { request } from "@/api/http";

// ArkApiKeyStatus 服务端 ARK API Key 配置状态
export type ArkApiKeyStatus = {
    configured: boolean;
};

// 查询服务端是否已配置 ARK API Key
export function fetchArkApiKeyStatus(signal?: AbortSignal) {
    return request<ArkApiKeyStatus>("/config/ark_key", {
        method: "GET",
        signal,
    });
}
