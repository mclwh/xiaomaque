import { describe, expect, it } from "vitest";
import { buildScriptSummaryUserMessage } from "../buildUserMessage.js";

describe("buildScriptSummaryUserMessage", () => {
    it("应包含原始创意文本", () => {
        const message = buildScriptSummaryUserMessage({
            creative: "这是一个关于哪吒与孙悟空的神话后传故事。",
        });

        expect(message).toContain("原始创意：");
        expect(message).toContain("哪吒与孙悟空");
    });

    it("应包含用户指定的集数约束", () => {
        const message = buildScriptSummaryUserMessage({
            creative: "这是一个关于哪吒与孙悟空的神话后传故事。",
            episodeCount: 60,
        });

        expect(message).toContain("制作参数：");
        expect(message).toContain("目标集数：60 集");
        expect(message).toContain("必须与该值完全一致");
    });

    it("应包含画面风格说明", () => {
        const message = buildScriptSummaryUserMessage({
            creative: "这是一个关于哪吒与孙悟空的神话后传故事。",
            imageStyleId: "palace-intrigue-cold",
        });

        expect(message).toContain("画面风格：宫斗权谋冷峻");
        expect(message).toContain("palace-intrigue-cold");
        expect(message).toContain("整体美学");
    });
});
