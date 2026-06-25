import { describe, expect, it } from "vitest";
import { detectMentionTrigger } from "@/lib/promptMention";
import {
    buildEpisodeMentionAssetItems,
    resolveEpisodeMentionChipLabel,
    resolveMentionChipFromAsset,
} from "@/lib/episodeMentionAssets";
import type { ProjectAsset } from "@/api/asset";

// mockAsset 测试用资产
function mockAsset(
    overrides: Partial<ProjectAsset> & Pick<ProjectAsset, "id" | "type">,
): ProjectAsset {
    return {
        id: overrides.id,
        type: overrides.type,
        assetType: overrides.type,
        name: overrides.name ?? null,
        cover: overrides.cover ?? null,
        url: overrides.url ?? null,
        params: overrides.params ?? null,
        projectId: overrides.projectId ?? 1,
        deriveId: overrides.deriveId ?? null,
        serieIds: overrides.serieIds ?? [10],
        createdAt: overrides.createdAt ?? "",
        updatedAt: overrides.updatedAt ?? "",
    };
}

describe("detectMentionTrigger", () => {
    it("识别光标前的 @ 关键词", () => {
        expect(detectMentionTrigger("hello @角色")).toEqual({
            query: "角色",
            startOffset: 6,
        });
    });

    it("无 @ 时返回 null", () => {
        expect(detectMentionTrigger("hello world")).toBeNull();
    });
});

describe("buildEpisodeMentionAssetItems", () => {
    it("仅返回本集绑定资产", () => {
        const assets = [
            mockAsset({ id: 1, type: "character", serieIds: [10] }),
            mockAsset({ id: 2, type: "character", serieIds: [20] }),
        ];

        const items = buildEpisodeMentionAssetItems(assets, 10, "episode", "");

        expect(items.map((item) => item.asset.id)).toEqual([1]);
    });

    it("按关键词过滤资产", () => {
        const assets = [
            mockAsset({
                id: 1,
                type: "character",
                name: "小明",
                params: { canvas: { appearanceName: "基础形象" } },
            }),
            mockAsset({
                id: 2,
                type: "character",
                name: "小红",
                params: { canvas: { appearanceName: "战斗形象" } },
            }),
        ];

        const items = buildEpisodeMentionAssetItems(assets, 10, "series", "小明");

        expect(items.length).toBe(1);
        expect(items[0]?.primaryLabel).toBe("小明");
    });
});

describe("resolveEpisodeMentionChipLabel", () => {
    it("角色资产优先展示形象名", () => {
        const label = resolveEpisodeMentionChipLabel({
            asset: mockAsset({ id: 1, type: "character" }),
            tabKey: "character",
            sectionLabel: "角色",
            primaryLabel: "小明",
            secondaryLabel: "基础形象",
            previewUrl: null,
            searchText: "",
        });

        expect(label).toBe("基础形象");
    });
});

describe("resolveMentionChipFromAsset", () => {
    it("角色资产展示角色名、形象名与音频绑定状态", () => {
        expect(
            resolveMentionChipFromAsset(
                mockAsset({
                    id: 29,
                    type: "character",
                    name: "小樱",
                    params: {
                        canvas: {
                            appearanceName: "巫女服",
                            voiceAudio: { sourceAssetId: 8, url: "audio/a.mp3" },
                        },
                    },
                }),
            ),
        ).toEqual({
            assetId: 29,
            label: "巫女服",
            previewUrl: null,
            characterName: "小樱",
            appearanceName: "巫女服",
            hasVoiceAudio: true,
        });
    });

    it("未绑定音频时 hasVoiceAudio 为 false", () => {
        expect(
            resolveMentionChipFromAsset(
                mockAsset({
                    id: 3,
                    type: "character",
                    name: "小明",
                    params: { canvas: { appearanceName: "基础形象" } },
                }),
            ).hasVoiceAudio,
        ).toBe(false);
    });

    it("非角色资产仅返回 label", () => {
        expect(
            resolveMentionChipFromAsset(
                mockAsset({
                    id: 5,
                    type: "scene",
                    name: "教室",
                }),
            ),
        ).toEqual({
            assetId: 5,
            label: "教室",
            previewUrl: null,
        });
    });
});
