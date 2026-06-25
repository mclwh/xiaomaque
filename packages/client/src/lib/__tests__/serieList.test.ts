import { describe, expect, it } from "vitest";
import type { ProjectSerie } from "@/api/serie";
import { removeSeriesByIds, upsertSerieInList } from "@/lib/serieList";

// baseSeries 测试用分集列表
const baseSeries: ProjectSerie[] = [
    {
        id: 1,
        name: "第 1 集",
        fragments: [],
        params: null,
        projectId: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
    },
    {
        id: 2,
        name: "第 2 集",
        fragments: [],
        params: null,
        projectId: 1,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
    },
];

describe("removeSeriesByIds", () => {
    it("移除指定分集后返回剩余列表", () => {
        expect(removeSeriesByIds(baseSeries, [1])).toEqual([baseSeries[1]]);
    });

    it("未指定删除 ID 时保持原列表", () => {
        expect(removeSeriesByIds(baseSeries, [])).toBe(baseSeries);
    });
});

describe("upsertSerieInList", () => {
    it("用更新后的分集替换列表项", () => {
        const updated = {
            ...baseSeries[0],
            params: { subtitle: "新名称" },
        };

        expect(upsertSerieInList(baseSeries, updated)).toEqual([updated, baseSeries[1]]);
    });
});
