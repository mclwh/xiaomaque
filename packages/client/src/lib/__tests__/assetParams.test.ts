import { describe, expect, it } from "vitest";
import {
    buildAssetParamsWithGeneration,
    buildAssetParamsWithReferenceSource,
    buildAssetParamsWithoutReferenceSource,
    mergeAssetParams,
    patchAssetCanvasParams,
    readAssetAudioCharacterBinding,
    readAssetCanvasParams,
    readAssetGenerationSettings,
    readAssetParams,
    readAssetReferenceSourceAssetId,
    readAssetVoiceAudio,
    readAssetCharacterName,
    readAssetEntityName,
    readAssetAppearanceName,
} from "@/lib/assetParams";

describe("assetParams", () => {
    it("readAssetParams 空值返回 null", () => {
        expect(readAssetParams(null)).toBeNull();
        expect(readAssetParams(undefined)).toBeNull();
    });

    it("readAssetCanvasParams 读取 canvas 命名空间", () => {
        const params = {
            canvas: {
                position: { x: 10, y: 20 },
                textContent: "hello",
            },
        };

        expect(readAssetCanvasParams(params)).toEqual({
            position: { x: 10, y: 20 },
            textContent: "hello",
        });
    });

    it("mergeAssetParams 保留非 canvas 顶层字段", () => {
        const existing = { legacy: true, canvas: { textContent: "old" } };
        const merged = mergeAssetParams(existing, { textContent: "new", position: { x: 0, y: 0 } });

        expect(merged).toEqual({
            legacy: true,
            canvas: { textContent: "new", position: { x: 0, y: 0 } },
        });
    });

    it("patchAssetCanvasParams 局部更新 canvas", () => {
        const existing = {
            canvas: {
                position: { x: 1, y: 2 },
                generation: {
                    prompt: "cat",
                    modelId: "seedream-5.0",
                    aspectRatio: "1:1",
                    resolution: "3K",
                },
            },
        };

        const patched = patchAssetCanvasParams(existing, {
            textContent: "updated",
        });

        expect(patched.canvas?.textContent).toBe("updated");
        expect(patched.canvas?.position).toEqual({ x: 1, y: 2 });
        expect(patched.canvas?.generation?.prompt).toBe("cat");
    });

    it("buildAssetParamsWithReferenceSource 写入引用来源", () => {
        const params = buildAssetParamsWithReferenceSource(null, 42);

        expect(readAssetReferenceSourceAssetId(params)).toBe(42);
    });

    it("buildAssetParamsWithoutReferenceSource 清除引用来源", () => {
        const params = buildAssetParamsWithoutReferenceSource({
            canvas: {
                referenceSourceAssetId: 42,
                position: { x: 0, y: 0 },
            },
        });

        expect(readAssetReferenceSourceAssetId(params)).toBeNull();
        expect(readAssetCanvasParams(params)?.position).toEqual({ x: 0, y: 0 });
    });

    it("readAssetGenerationSettings 校验必填字段", () => {
        const valid = buildAssetParamsWithGeneration(null, {
            prompt: "dog",
            modelId: "seedream-5.0",
            aspectRatio: "16:9",
            resolution: "3K",
        });

        expect(readAssetGenerationSettings(valid)).toEqual({
            prompt: "dog",
            modelId: "seedream-5.0",
            aspectRatio: "16:9",
            resolution: "3K",
        });

        expect(readAssetGenerationSettings({ canvas: { generation: { prompt: "x" } } })).toBeNull();
    });

    it("readAssetVoiceAudio 与 readAssetAudioCharacterBinding", () => {
        const params = mergeAssetParams(null, {
            voiceAudio: { sourceAssetId: 9, url: "audio/a.mp3" },
            audioCharacterBinding: {
                mode: "single",
                characterAssetIds: [3],
                deriveId: null,
            },
        });

        expect(readAssetVoiceAudio(params)).toEqual({
            sourceAssetId: 9,
            url: "audio/a.mp3",
        });
        expect(readAssetAudioCharacterBinding(params)).toEqual({
            mode: "single",
            characterAssetIds: [3],
            deriveId: null,
        });
    });

    it("readAssetCharacterName 读取旧版 params.canvas.characterName", () => {
        expect(readAssetCharacterName({ canvas: { characterName: "  张三  " } })).toBe("张三");
        expect(readAssetCharacterName({ canvas: { characterName: "   " } })).toBeNull();
        expect(readAssetCharacterName(null)).toBeNull();
    });

    it("readAssetEntityName 读取 asset.name 作为角色/场景名", () => {
        expect(
            readAssetEntityName({
                name: "  张三  ",
                type: "character",
                params: null,
            }),
        ).toBe("张三");
        expect(
            readAssetEntityName({
                name: "角色",
                type: "character",
                params: null,
            }),
        ).toBeNull();
        expect(
            readAssetEntityName({
                name: "客厅",
                type: "scene",
                params: null,
            }),
        ).toBe("客厅");
    });

    it("readAssetEntityName 兼容旧数据（角色名在 params）", () => {
        expect(
            readAssetEntityName({
                name: "角色",
                type: "character",
                params: { canvas: { characterName: "李四" } },
            }),
        ).toBe("李四");
    });

    it("readAssetAppearanceName 读取 params.canvas.appearanceName", () => {
        expect(
            readAssetAppearanceName({
                name: "张三",
                type: "character",
                params: { canvas: { appearanceName: "战斗形象" } },
            }),
        ).toBe("战斗形象");
    });

    it("readAssetAppearanceName 兼容旧数据（形象名在 asset.name）", () => {
        expect(
            readAssetAppearanceName({
                name: "日常形象",
                type: "character",
                params: { canvas: { characterName: "王五" } },
            }),
        ).toBe("日常形象");
    });
});
