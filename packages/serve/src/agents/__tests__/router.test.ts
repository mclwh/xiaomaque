import { describe, expect, it, vi } from "vitest";

vi.mock("../../config/env.js", () => ({
    env: {
        OPENAI_API_KEY: undefined,
    },
}));

import { AGENT_REGISTRY, formatAgentsForPrompt, getAgentById } from "../registry.js";
import { routeToAgent } from "../router.js";
import { SCRIPT_SUMMARY_AGENT_ID } from "../implementations/scriptSummary/constants.js";

describe("agent registry", () => {
    it("包含剧本摘要 Agent", () => {
        const ids = AGENT_REGISTRY.map((agent) => agent.id);
        expect(ids).toEqual([SCRIPT_SUMMARY_AGENT_ID]);
    });

    it("getAgentById 能查找剧本摘要 Agent", () => {
        expect(getAgentById(SCRIPT_SUMMARY_AGENT_ID)?.name).toBe("剧本摘要");
        expect(getAgentById("unknown")).toBeUndefined();
    });

    it("formatAgentsForPrompt 包含剧本摘要描述", () => {
        const text = formatAgentsForPrompt();
        expect(text).toContain("id: script-summary");
        expect(text).toContain("剧本摘要");
    });
});

describe("routeToAgent", () => {
    it("空查询应抛出错误", async () => {
        await expect(routeToAgent("   ")).rejects.toThrow("路由查询不能为空");
    });

    it("剧本摘要关键词应路由到 script-summary", async () => {
        const result = await routeToAgent("帮我把这段创意整理成剧本摘要和人物小传");

        expect(result.agentId).toBe(SCRIPT_SUMMARY_AGENT_ID);
        expect(result.confidence).toBeGreaterThan(0);
    });
});
