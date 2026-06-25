import { describe, expect, it } from "vitest";
import { formatAssetSerieEpisodeLabel } from "@/lib/serieDisplay";

describe("formatAssetSerieEpisodeLabel", () => {
    // series 测试用集数列表
    const series = [
        {
            id: 1,
            name: "第 1 集",
            fragments: null,
            params: null,
            projectId: 1,
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
        },
        {
            id: 2,
            name: "第 2 集",
            fragments: null,
            params: null,
            projectId: 1,
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
        },
    ];

    it("未绑定集数时返回未设置", () => {
        expect(formatAssetSerieEpisodeLabel([], series)).toBe("未设置");
        expect(formatAssetSerieEpisodeLabel(undefined, series)).toBe("未设置");
    });

    it("按选中集数拼接展示文案", () => {
        expect(formatAssetSerieEpisodeLabel([1, 2], series)).toBe("第 1 集、第 2 集");
    });
});
