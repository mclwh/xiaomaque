import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/env.js", () => ({
    env: {
        ARK_API_KEY: "env-default-key",
    },
}));

import { readArkApiKeyHeader, resolveArkApiKey, isServerArkApiKeyConfigured } from "../arkApiKey.js";

describe("arkApiKey", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("优先使用客户端传入的 Key", () => {
        expect(resolveArkApiKey("client-key")).toBe("client-key");
    });

    it("客户端未传时回退到环境变量", () => {
        expect(resolveArkApiKey()).toBe("env-default-key");
        expect(resolveArkApiKey("   ")).toBe("env-default-key");
    });

    it("读取并裁剪请求头中的 Key", () => {
        expect(readArkApiKeyHeader("  abc  ")).toBe("abc");
        expect(readArkApiKeyHeader(["  def  "])).toBe("def");
        expect(readArkApiKeyHeader(undefined)).toBeUndefined();
    });

    it("判断服务端是否已配置 Key", () => {
        expect(isServerArkApiKeyConfigured()).toBe(true);
    });
});
