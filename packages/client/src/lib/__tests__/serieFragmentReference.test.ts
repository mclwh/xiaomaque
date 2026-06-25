import { describe, expect, it } from "vitest";
import type { ProjectAsset } from "@/api/asset";
import {
    appendSerieFragmentReference,
    enrichSerieFragmentReferenceWithAssets,
    parseSerieFragmentReferenceItem,
    parseSerieFragmentReferenceList,
    resolveSerieFragmentReferenceNames,
    syncSerieFragmentReferenceWithContent,
} from "@/lib/serieFragmentReference";

// mockAsset 测试用资产
function mockAsset(overrides: Partial<ProjectAsset> = {}): ProjectAsset {
    return {
        id: 1,
        projectId: 1,
        type: "character",
        assetType: "image",
        name: "小明",
        url: null,
        cover: null,
        deriveId: null,
        serieIds: [],
        params: { canvas: { appearanceName: "基础形象" } },
        ...overrides,
    };
}

describe("serieFragmentReference", () => {
    it("解析全量资产对象中的 id", () => {
        expect(
            parseSerieFragmentReferenceItem({
                id: 29,
                type: "character",
                assetType: "image",
                name: "小美哦",
            }),
        ).toEqual({
            assetId: 29,
            type: "character",
        });
    });

    it("解析 assetId、url、type、characterName 与 appearanceName", () => {
        expect(
            parseSerieFragmentReferenceList([
                { assetId: 1 },
                { asset_id: 2, url: "https://cdn.example.com/a.png" },
                { assetId: 3, type: "character" },
                {
                    assetId: 4,
                    character_name: "张三",
                    appearance_name: "战斗形象",
                },
            ]),
        ).toEqual([
            { assetId: 1 },
            { assetId: 2, url: "https://cdn.example.com/a.png" },
            { assetId: 3, type: "character" },
            {
                assetId: 4,
                characterName: "张三",
                appearanceName: "战斗形象",
            },
        ]);
    });

    it("resolveSerieFragmentReferenceNames 读取角色名与形象名", () => {
        expect(resolveSerieFragmentReferenceNames(mockAsset())).toEqual({
            characterName: "小明",
            appearanceName: "基础形象",
        });
        expect(
            resolveSerieFragmentReferenceNames(
                mockAsset({ type: "scene", name: "客厅", params: null }),
            ),
        ).toEqual({});
    });

    it("追加引用时去重", () => {
        expect(appendSerieFragmentReference([{ assetId: 1 }], 1)).toEqual([{ assetId: 1 }]);
        expect(appendSerieFragmentReference([{ assetId: 1 }], 2)).toEqual([
            { assetId: 1 },
            { assetId: 2 },
        ]);
    });

    it("追加引用时写入 url、type、角色名与形象名", () => {
        expect(
            appendSerieFragmentReference([], 3, {
                url: "https://cdn.example.com/b.png",
                type: "character",
                characterName: "小明",
                appearanceName: "基础形象",
            }),
        ).toEqual([
            {
                assetId: 3,
                url: "https://cdn.example.com/b.png",
                type: "character",
                characterName: "小明",
                appearanceName: "基础形象",
            },
        ]);
        expect(appendSerieFragmentReference([], 4, {})).toEqual([{ assetId: 4 }]);
        expect(appendSerieFragmentReference([], 5, { type: "prop" })).toEqual([
            { assetId: 5, type: "prop" },
        ]);
    });

    it("按 content 同步 reference，移除已删资产并保留字段", () => {
        const reference = [
            {
                assetId: 1,
                url: "https://cdn.example.com/a.png",
                type: "character",
                characterName: "小明",
                appearanceName: "基础形象",
            },
            {
                assetId: 2,
                url: "https://cdn.example.com/b.png",
                type: "scene",
            },
        ];

        expect(
            syncSerieFragmentReferenceWithContent(reference, "旁白 @asset:2 结束"),
        ).toEqual([{ assetId: 2, url: "https://cdn.example.com/b.png", type: "scene" }]);
        expect(syncSerieFragmentReferenceWithContent(reference, "纯文本")).toEqual([]);
    });

    it("同步 reference 时根据资产补全角色名与形象名", () => {
        const assets = [mockAsset({ id: 9 })];

        expect(
            syncSerieFragmentReferenceWithContent([{ assetId: 9 }], "镜头 @asset:9", assets),
        ).toEqual([
            {
                assetId: 9,
                type: "character",
                characterName: "小明",
                appearanceName: "基础形象",
            },
        ]);
    });

    it("enrichSerieFragmentReferenceWithAssets 补全缺失名称", () => {
        expect(
            enrichSerieFragmentReferenceWithAssets([{ assetId: 9, type: "character" }], [
                mockAsset({ id: 9 }),
            ]),
        ).toEqual([
            {
                assetId: 9,
                type: "character",
                characterName: "小明",
                appearanceName: "基础形象",
            },
        ]);
    });
});
