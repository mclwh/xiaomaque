import { describe, expect, it } from "vitest";
import { formatScriptSummaryText } from "../format.js";
import type { ScriptSummary } from "../types.js";

/**
 * 剧本摘要格式化单元测试
 */

// MOCK_SUMMARY 用于测试的结构化摘要样例
const MOCK_SUMMARY: ScriptSummary = {
    episodeCount: 60,
    storyType: "古风奇幻+神话后传+反乌托邦",
    targetAudience: "男频 / 大众",
    coreHook: "神话顶流联手+降妖救民打脸+揭露仙佛黑幕",
    oneLineStory: "斗战胜佛、二郎神、哪吒联手清算腐朽仙佛秩序，胜利后却发现真正的神权陷阱才刚开启。",
    characters: [
        {
            name: "孙悟空",
            title: "斗战胜佛",
            roleType: "主角",
            visualImage: "男，猴面人身，身披佛袍却藏金箍棒",
            coreTags: "斗战胜佛、桀骜慈悲",
            identityBackground: "佛门斗战胜佛，核心动机是救人间孩童",
            growthExperience: "取经后被封为佛，见妖祸吞噬百姓才重燃斗心",
            personality: "强势、冲动、重情重义",
            relationships: "与杨戬、哪吒结成生死同盟",
            growthArc: "被佛名束缚的斗战胜佛 -> 新齐天大圣 -> 胜利后被封印",
        },
    ],
    synopsis: "西游之后，三界表面各司其职，实则仙佛以香火操控人间……",
};

describe("formatScriptSummaryText", () => {
    it("应包含各板块标题与字段值", () => {
        const text = formatScriptSummaryText(MOCK_SUMMARY);

        expect(text).toContain("自定义集数\n60");
        expect(text).toContain("故事类型\n古风奇幻+神话后传+反乌托邦");
        expect(text).toContain("目标受众\n男频 / 大众");
        expect(text).toContain("核心梗\n神话顶流联手+降妖救民打脸+揭露仙佛黑幕");
        expect(text).toContain("一句话故事\n");
        expect(text).toContain("人物小传");
        expect(text).toContain("孙悟空，斗战胜佛");
        expect(text).toContain("角色类型：主角");
        expect(text).toContain("故事梗概\n西游之后");
    });
});
