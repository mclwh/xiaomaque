import { describe, expect, it, vi } from "vitest";

vi.mock("../storageUrl.js", () => ({
    resolveAssetMediaUrl: (key: string | null) => key,
}));

import { formatAssetForApi } from "../formatAsset.js";
import {
    parseSerieFragmentDbId,
    parseSerieFragmentReferenceSaveItem,
    parseSerieFragmentSaveItem,
    parseSerieFragmentSaveList,
    serializeSerieFragmentRow,
    serializeSerieFragmentRows,
} from "../serieFragment.js";

// mockAssetRow 测试用完整资产行
function mockAssetRow(
    overrides: Partial<Parameters<typeof formatAssetForApi>[0]> &
        Pick<Parameters<typeof formatAssetForApi>[0], "id">,
) {
    return {
        id: overrides.id,
        type: overrides.type ?? "character",
        asset_type: overrides.asset_type ?? "image",
        name: overrides.name ?? null,
        cover: overrides.cover ?? null,
        url: overrides.url ?? null,
        params: overrides.params ?? null,
        project_id: overrides.project_id ?? 1,
        derive_id: overrides.derive_id ?? null,
        created_at: overrides.created_at ?? new Date("2026-01-01T00:00:00.000Z"),
        updated_at: overrides.updated_at ?? new Date("2026-01-01T00:00:00.000Z"),
        asset_series: overrides.asset_series ?? [],
    };
}

describe("serieFragment lib", () => {
    it("parseSerieFragmentDbId 识别数字 ID，忽略临时客户端 ID", () => {
        expect(parseSerieFragmentDbId(12)).toBe(12);
        expect(parseSerieFragmentDbId("34")).toBe(34);
        expect(parseSerieFragmentDbId("fragment-abc")).toBeNull();
        expect(parseSerieFragmentDbId(null)).toBeNull();
    });

    it("parseSerieFragmentReferenceSaveItem 仅解析 assetId", () => {
        expect(
            parseSerieFragmentReferenceSaveItem({
                assetId: 9,
                url: "https://cdn.example.com/a.png",
                type: "character",
            }),
        ).toEqual({
            assetId: 9,
        });
    });

    it("parseSerieFragmentReferenceSaveItem 兼容全量资产对象", () => {
        expect(
            parseSerieFragmentReferenceSaveItem({
                id: 29,
                type: "character",
                assetType: "image",
                name: "小美哦",
            }),
        ).toEqual({
            assetId: 29,
        });
    });

    it("parseSerieFragmentSaveItem 解析分镜保存项", () => {
        expect(
            parseSerieFragmentSaveItem(
                {
                    id: "fragment-temp",
                    content: "旁白 @asset:1",
                    reference: [{ assetId: 1, type: "character" }],
                    cover: "",
                    video: "",
                    durationSec: 12,
                },
                1,
            ),
        ).toEqual({
            id: null,
            sortOrder: 1,
            content: "旁白 @asset:1",
            cover: "",
            video: "",
            durationSec: 12,
            references: [{ assetId: 1 }],
        });
    });

    it("parseSerieFragmentSaveList 按顺序解析多条分镜", () => {
        expect(
            parseSerieFragmentSaveList([
                { id: 1, content: "a", reference: [] },
                { content: "b", reference: [] },
            ]),
        ).toHaveLength(2);
        expect(parseSerieFragmentSaveList([{ id: 1, content: "a", reference: [] }])[0]?.sortOrder).toBe(
            0,
        );
    });

    it("serializeSerieFragmentRows 返回全量资产 reference", () => {
        const createdAt = new Date("2026-01-01T00:00:00.000Z");
        const updatedAt = new Date("2026-01-02T00:00:00.000Z");
        const asset = mockAssetRow({
            id: 9,
            name: "小明",
            url: "image/a.png",
            params: { canvas: { appearanceName: "基础形象" } },
            created_at: createdAt,
            updated_at: updatedAt,
            asset_series: [{ serie_id: 3 }],
        });

        expect(
            serializeSerieFragmentRows([
                {
                    id: 1,
                    sort_order: 0,
                    content: "",
                    cover: "",
                    video: "",
                    duration_sec: null,
                    params: null,
                    asset_references: [],
                },
                {
                    id: 2,
                    sort_order: 1,
                    content: "内容",
                    cover: "",
                    video: "",
                    duration_sec: 10,
                    params: null,
                    asset_references: [{ asset_id: 9, asset }],
                },
            ]),
        ).toEqual([
            {
                id: 1,
                content: "",
                reference: [],
                cover: "",
                video: "",
            },
            {
                id: 2,
                content: "内容",
                reference: [formatAssetForApi(asset)],
                cover: "",
                video: "",
                durationSec: 10,
            },
        ]);
    });

    it("serializeSerieFragmentRow 保留空 cover / video", () => {
        expect(
            serializeSerieFragmentRow({
                id: 1,
                sort_order: 0,
                content: "",
                cover: null,
                video: null,
                duration_sec: null,
                params: null,
                asset_references: [],
            }).cover,
        ).toBe("");
    });

    it("parseSerieFragmentSaveItem 将签名 URL 归一化为存储 key", () => {
        expect(
            parseSerieFragmentSaveItem(
                {
                    id: 1,
                    content: "镜头",
                    reference: [],
                    cover:
                        "https://cdn.example.com/xiaomaque/image/a.jpg?e=123&token=abc",
                    video: "https://cdn.example.com/xiaomaque/video/b.mp4?e=456&token=def",
                },
                0,
            ),
        ).toEqual({
            id: 1,
            sortOrder: 0,
            content: "镜头",
            cover: "/xiaomaque/image/a.jpg",
            video: "/xiaomaque/video/b.mp4",
            durationSec: null,
            references: [],
        });
    });

    it("serializeSerieFragmentRow 输出 params.lastFrame", () => {
        expect(
            serializeSerieFragmentRow({
                id: 1,
                sort_order: 0,
                content: "",
                cover: "",
                video: "video/a.mp4",
                duration_sec: null,
                params: { lastFrame: "image/last.jpg" },
                asset_references: [],
            }),
        ).toEqual({
            id: 1,
            content: "",
            reference: [],
            cover: "",
            video: "video/a.mp4",
            params: { lastFrame: "image/last.jpg" },
        });
    });
});
