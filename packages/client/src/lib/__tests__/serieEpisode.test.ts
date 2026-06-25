import { describe, expect, it } from "vitest";
import type { ProjectSerie } from "@/api/serie";
import {
    buildNextSerieCreateInput,
    buildSerieRenameUpdate,
    formatSerieEpisodeCardTitle,
    formatSerieEpisodeStats,
    resolveSerieEditableSubtitle,
    resolveSerieStatusLabel,
} from "@/lib/serieEpisode";

describe("buildNextSerieCreateInput", () => {
    it("首个分集默认命名为第 1 集", () => {
        expect(buildNextSerieCreateInput([])).toEqual({
            name: "第 1 集",
            params: {
                subtitle: "第一集",
                stats: {
                    characterCount: 0,
                    sceneCount: 0,
                    storyboardCount: 0,
                },
            },
        });
    });

    it("已有分集时按数量递增默认名称", () => {
        const existing = [{ name: "第 1 集" }, { name: "第 2 集" }];

        expect(buildNextSerieCreateInput(existing)).toEqual({
            name: "第 3 集",
            params: {
                subtitle: "第三集",
                stats: {
                    characterCount: 0,
                    sceneCount: 0,
                    storyboardCount: 0,
                },
            },
        });
    });
});

describe("formatSerieEpisodeCardTitle", () => {
    // baseSerie 基础分集数据
    const baseSerie: ProjectSerie = {
        id: 1,
        name: "第 1 集",
        fragments: null,
        params: {
            subtitle: "第一集",
        },
        projectId: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
    };

    it("按集序号与副标题拼接卡片标题", () => {
        expect(formatSerieEpisodeCardTitle(baseSerie, 1)).toBe("第1集：第一集");
    });

    it("缺少副标题时回退到分集名称", () => {
        expect(
            formatSerieEpisodeCardTitle(
                {
                    ...baseSerie,
                    params: null,
                },
                2,
            ),
        ).toBe("第2集：第 1 集");
    });
});

describe("resolveSerieEditableSubtitle", () => {
    it("优先读取 params.subtitle", () => {
        const serie: ProjectSerie = {
            id: 1,
            name: "第 1 集",
            fragments: [],
            params: { subtitle: "开场篇" },
            projectId: 1,
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
        };

        expect(resolveSerieEditableSubtitle(serie)).toBe("开场篇");
    });
});

describe("buildSerieRenameUpdate", () => {
    it("更新 params.subtitle 并保留其他字段", () => {
        const serie: ProjectSerie = {
            id: 1,
            name: "第 1 集",
            fragments: [],
            params: {
                subtitle: "第一集",
                stats: { characterCount: 1 },
            },
            projectId: 1,
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
        };

        expect(buildSerieRenameUpdate(serie, " 新名称 ").params).toEqual({
            subtitle: "新名称",
            stats: { characterCount: 1 },
        });
    });
});

describe("formatSerieEpisodeStats", () => {
    it("从 params.stats 读取角色/场景/分镜数量", () => {
        const serie: ProjectSerie = {
            id: 1,
            name: "第 1 集",
            fragments: null,
            params: {
                stats: {
                    characterCount: 3,
                    sceneCount: 0,
                    storyboardCount: 2,
                },
            },
            projectId: 1,
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
        };

        expect(formatSerieEpisodeStats(serie)).toBe("角色 3 · 场景 0 · 分镜 2");
    });

    it("缺少统计时默认展示 0", () => {
        const serie: ProjectSerie = {
            id: 1,
            name: "第 1 集",
            fragments: null,
            params: null,
            projectId: 1,
            createdAt: "2026-01-01",
            updatedAt: "2026-01-01",
        };

        expect(formatSerieEpisodeStats(serie)).toBe("角色 0 · 场景 0 · 分镜 0");
    });
});

describe("resolveSerieStatusLabel", () => {
    it("fragments 为空数组时展示待生成", () => {
        expect(resolveSerieStatusLabel([])).toBe("待生成");
    });

    it("fragments 为 null 时展示待生成", () => {
        expect(resolveSerieStatusLabel(null)).toBe("待生成");
    });

    it("fragments 有内容时展示已生成", () => {
        expect(resolveSerieStatusLabel([{ id: 1 }])).toBe("已生成");
    });

    it("生成中优先于 fragments 判断", () => {
        expect(resolveSerieStatusLabel([], { status: "generating" })).toBe("生成中");
    });
});
