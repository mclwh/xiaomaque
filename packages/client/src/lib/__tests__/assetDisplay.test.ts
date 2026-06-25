import { describe, expect, it } from "vitest";
import type { ProjectAsset } from "@/api/asset";
import {
    resolveCharacterAppearanceLabel,
    resolveCharacterAssetCardLabels,
    resolveCharacterGroupCardLabels,
    resolveCharacterNameLabel,
} from "@/lib/assetDisplay";
import type { ProjectAssetDisplayGroup } from "@/lib/projectAssetGroups";

// createAsset 构造测试资产
function createAsset(overrides: Partial<ProjectAsset> = {}): ProjectAsset {
    return {
        id: 1,
        projectId: 1,
        type: "character",
        assetType: "image",
        name: "角色",
        url: null,
        cover: null,
        deriveId: null,
        serieIds: [],
        params: null,
        ...overrides,
    };
}

describe("assetDisplay", () => {
    it("resolveCharacterAppearanceLabel 读取 params.canvas.appearanceName", () => {
        expect(
            resolveCharacterAppearanceLabel(
                createAsset({
                    name: "张三",
                    params: { canvas: { appearanceName: "战斗形象" } },
                }),
            ),
        ).toBe("战斗形象");
        expect(resolveCharacterAppearanceLabel(createAsset({ name: "角色" }))).toBe("基础形象");
        expect(
            resolveCharacterAppearanceLabel(createAsset({ name: "角色" }), "默认形象"),
        ).toBe("默认形象");
    });

    it("resolveCharacterAppearanceLabel 兼容旧数据（形象名在 asset.name）", () => {
        expect(
            resolveCharacterAppearanceLabel(
                createAsset({
                    name: "日常形象",
                    params: { canvas: { characterName: "李四" } },
                }),
            ),
        ).toBe("日常形象");
    });

    it("resolveCharacterNameLabel 读取 asset.name", () => {
        expect(resolveCharacterNameLabel(createAsset({ name: "张三" }))).toBe("张三");
        expect(resolveCharacterNameLabel(createAsset({ name: "角色" }))).toBe("未命名角色");
    });

    it("resolveCharacterNameLabel 兼容旧数据（角色名在 params）", () => {
        expect(
            resolveCharacterNameLabel(
                createAsset({
                    name: "角色",
                    params: { canvas: { characterName: "张三" } },
                }),
            ),
        ).toBe("张三");
    });

    it("resolveCharacterAssetCardLabels 返回角色名与形象名", () => {
        expect(
            resolveCharacterAssetCardLabels(
                createAsset({
                    name: "李四",
                    params: { canvas: { appearanceName: "日常形象" } },
                }),
            ),
        ).toEqual({
            characterName: "李四",
            appearanceName: "日常形象",
        });
    });

    it("resolveCharacterGroupCardLabels 从分组内资产解析名称", () => {
        const group: ProjectAssetDisplayGroup = {
            key: "derive-1",
            deriveId: "derive-1",
            assets: [
                createAsset({
                    id: 1,
                    name: "王五",
                    params: { canvas: { appearanceName: "基础形象" } },
                }),
                createAsset({
                    id: 2,
                    name: "王五",
                    params: { canvas: { appearanceName: "战斗形象" } },
                }),
            ],
            representativeAsset: createAsset({ id: 1 }),
            totalCount: 2,
            pendingCount: 0,
        };

        expect(resolveCharacterGroupCardLabels(group)).toEqual({
            characterName: "王五",
            appearanceName: "基础形象",
        });
    });
});
