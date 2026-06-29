import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/env.js", () => ({
    env: {
        OPENAI_API_KEY: "env-default-openai-key",
    },
}));

import {
    readOpenaiApiKeyHeader,
    resolveOpenaiApiKey,
    isServerOpenaiApiKeyConfigured,
} from "../openaiApiKey.js";

describe("openaiApiKey", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("优先使用客户端传入的 Key", () => {
        expect(resolveOpenaiApiKey("client-key")).toBe("client-key");
    });

    it("客户端未传时回退到环境变量", () => {
        expect(resolveOpenaiApiKey()).toBe("env-default-openai-key");
        expect(resolveOpenaiApiKey("   ")).toBe("env-default-openai-key");
    });

    it("读取并裁剪请求头中的 Key", () => {
        expect(readOpenaiApiKeyHeader("  abc  ")).toBe("abc");
        expect(readOpenaiApiKeyHeader(["  def  "])).toBe("def");
        expect(readOpenaiApiKeyHeader(undefined)).toBeUndefined();
    });

    it("判断服务端是否已配置 Key", () => {
        expect(isServerOpenaiApiKeyConfigured()).toBe(true);
    });
});
