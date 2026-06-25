import { describe, expect, it, vi } from "vitest";

vi.mock("../storageUrl.js", () => ({
    resolveAssetMediaUrl: (key: string | null) => key,
}));

vi.mock("../../config/env.js", () => ({
    env: {
        SEEDANCE_MODEL_2_0: "doubao-seedance-2-0-260128",
        SEEDANCE_MODEL_2_0_FAST: "doubao-seedance-2-0-fast-260128",
    },
}));

import { resolveSeedanceDurationFromContent, replaceDurationMentionsWithTimeRanges } from "../fragmentContentDuration.js";
import {
    buildSeedanceGenerateBody,
    buildSeedancePromptText,
    buildSeedanceReferenceCatalog,
} from "../buildSeedanceGenerateBody.js";

// characterAsset 测试用角色资产
const characterAsset = {
    id: 29,
    type: "character",
    assetType: "image",
    name: "小美",
    cover: "https://cdn.example.com/a.jpg",
    url: null,
    params: {
        canvas: {
            appearanceName: "日常形象",
            voiceAudio: { sourceAssetId: 8, url: "https://cdn.example.com/voice.mp3" },
        },
    },
    projectId: 1,
    deriveId: null,
    serieIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe("resolveSeedanceDurationFromContent", () => {
    it("无 @duration 时返回智能时长 -1", () => {
        expect(resolveSeedanceDurationFromContent("旁白描述")).toBe(-1);
        expect(resolveSeedanceDurationFromContent(undefined)).toBe(-1);
    });

    it("有 @duration 时合计秒数", () => {
        expect(resolveSeedanceDurationFromContent("开场 @duration:2 中间 @duration:5")).toBe(7);
    });

    it("合计超过 15 秒时封顶为 15", () => {
        expect(resolveSeedanceDurationFromContent("@duration:10 @duration:8")).toBe(15);
    });
});

describe("replaceDurationMentionsWithTimeRanges", () => {
    it("按顺序将 @duration 替换为渐进时间区间", () => {
        expect(
            replaceDurationMentionsWithTimeRanges(
                "这是分镜一：@duration:5，哇咔咔，呀哈哈哈，这是分镜二：@duration:8，这是分镜二内容",
            ),
        ).toBe("这是分镜一：00:00-00:05，哇咔咔，呀哈哈哈，这是分镜二：00:05-00:13，这是分镜二内容");
    });

    it("支持三个及以上分镜区间累加", () => {
        expect(
            replaceDurationMentionsWithTimeRanges(
                "这是分镜内容：@duration:3，咕咕咕嘎嘎嘎，这是分镜内容2：@duration:5，呀哈哈哈哈哦嚯嚯嚯，这是分镜内容3：@duration:4，卡卡卡卡啊哈哈哈哈",
            ),
        ).toBe(
            "这是分镜内容：00:00-00:03，咕咕咕嘎嘎嘎，这是分镜内容2：00:03-00:08，呀哈哈哈哈哦嚯嚯嚯，这是分镜内容3：00:08-00:12，卡卡卡卡啊哈哈哈哈",
        );
    });
});

describe("buildSeedanceReferenceCatalog", () => {
    it("图片与音频分别编号", () => {
        const catalog = buildSeedanceReferenceCatalog([
            characterAsset,
            {
                ...characterAsset,
                id: 30,
                name: "小明",
                cover: "https://cdn.example.com/b.jpg",
                params: { canvas: {} },
            },
        ]);

        expect(catalog.imageIndexByAssetId.get(29)).toBe(1);
        expect(catalog.imageIndexByAssetId.get(30)).toBe(2);
        expect(catalog.audioIndexByAssetId.get(29)).toBe(1);
        expect(catalog.audioIndexByAssetId.has(30)).toBe(false);
    });

    it("角色与场景参考图共用全局连续编号", () => {
        const catalog = buildSeedanceReferenceCatalog([
            characterAsset,
            {
                id: 40,
                type: "scene",
                assetType: "image",
                name: "时代广场",
                cover: "https://cdn.example.com/scene.jpg",
                url: null,
                params: {},
                projectId: 1,
                deriveId: null,
                serieIds: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        expect(catalog.imageIndexByAssetId.get(29)).toBe(1);
        expect(catalog.imageIndexByAssetId.get(40)).toBe(2);
    });
});

const VOICE_SECTION =
    "【强制约束：角色音色】以下角色说话的音色、语气、节奏与发声质感必须与对应参考音频严格一致，严禁替换、混用其他声线或自行改写：\n小美：参考音频1";

const APPEARANCE_SECTION =
    "【强制约束：角色形象】以下角色的面容、体型、发型、服饰与整体气质必须与对应参考图严格一致，严禁换脸、形象漂移或重绘为其他人物：\n小美：参考图1";

const STYLE_SECTION =
    "【强制约束：视频画面风格】全片画面必须严格遵循以下风格描述，严禁偏离、弱化或混用其他画风与镜头美学：\n像素艺术风格，清晰像素块，复古游戏美学，有限色板，8-bit 或 16-bit 质感";

const SCENE_SECTION =
    "【强制约束：场景】以下场景的空间结构、环境陈设、光影氛围必须与对应参考图严格一致，严禁替换为其他场景或大幅偏离参考画面：\n时代广场：参考图2";

describe("buildSeedancePromptText", () => {
    it("按声明块输出音色、形象与正文", () => {
        expect(buildSeedancePromptText("@asset:29 在时代广场跳极乐净土", [characterAsset])).toBe(
            `${VOICE_SECTION}\n\n${APPEARANCE_SECTION}\n\n小美（参考图1） 在时代广场跳极乐净土`,
        );
    });

    it("正文中间含 @asset 时替换为角色描述", () => {
        expect(buildSeedancePromptText("在时代广场跳极乐净土 @asset:29", [characterAsset])).toBe(
            `${VOICE_SECTION}\n\n${APPEARANCE_SECTION}\n\n在时代广场跳极乐净土 小美（参考图1）`,
        );
    });

    it("无绑定音频时仅声明角色形象", () => {
        expect(
            buildSeedancePromptText("镜头 @asset:29", [
                {
                    ...characterAsset,
                    params: { canvas: { appearanceName: "日常形象" } },
                },
            ]),
        ).toBe(`${APPEARANCE_SECTION}\n\n镜头 小美（参考图1）`);
    });

    it("顶部声明画面风格", () => {
        expect(
            buildSeedancePromptText("@asset:29 在时代广场跳极乐净土", [characterAsset], undefined, "pixel-art"),
        ).toBe(
            `${STYLE_SECTION}\n\n${VOICE_SECTION}\n\n${APPEARANCE_SECTION}\n\n小美（参考图1） 在时代广场跳极乐净土`,
        );
    });

    it("有场景时声明【场景】块", () => {
        const sceneAsset = {
            id: 40,
            type: "scene",
            assetType: "image",
            name: "时代广场",
            cover: "https://cdn.example.com/scene.jpg",
            url: null,
            params: {},
            projectId: 1,
            deriveId: null,
            serieIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        expect(
            buildSeedancePromptText("@asset:29 在 @asset:40 跳极乐净土", [characterAsset, sceneAsset]),
        ).toBe(
            `${VOICE_SECTION}\n\n${APPEARANCE_SECTION}\n\n${SCENE_SECTION}\n\n小美（参考图1） 在 时代广场（参考图2） 跳极乐净土`,
        );
    });
});

describe("buildSeedanceGenerateBody", () => {
    it("组装豆包原生 Seedance 请求体", () => {
        expect(
            buildSeedanceGenerateBody({
                content: "在时代广场跳极乐净土 @asset:29 @duration:5",
                model_id: "seedance-2",
                aspect_ratio: "9:16",
                resolution: "480p",
                reference: [characterAsset],
            }),
        ).toEqual({
            model: "doubao-seedance-2-0-260128",
            content: [
                {
                    type: "text",
                    text: `${VOICE_SECTION}\n\n${APPEARANCE_SECTION}\n\n在时代广场跳极乐净土 小美（参考图1） 00:00-00:05`,
                },
                { type: "image_url", image_url: { url: "https://cdn.example.com/a.jpg" }, role: "reference_image" },
                { type: "audio_url", audio_url: { url: "https://cdn.example.com/voice.mp3" }, role: "reference_audio" },
            ],
            duration: 5,
            ratio: "9:16",
            resolution: "480p",
            watermark: false,
            return_last_frame: true,
        });
    });

    it("无时长标签时 duration 为 -1", () => {
        expect(
            buildSeedanceGenerateBody({
                content: "纯文本镜头",
                model_id: "seedance-2-fast",
            }).duration,
        ).toBe(-1);
    });
});
