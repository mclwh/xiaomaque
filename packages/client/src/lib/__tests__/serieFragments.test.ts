import { describe, expect, it } from "vitest";
import {
    createDefaultSerieFragments,
    formatSerieFragmentLabel,
    parseSerieFragments,
    resolveInitialFragmentId,
    resolveSerieFragmentDisplayLabel,
    resolveSerieFragmentDurationSeconds,
    serializeSerieFragments,
} from "@/lib/serieFragments";

describe("parseSerieFragments", () => {
    it("解析默认分镜结构 content / reference / cover", () => {
        const fragments = parseSerieFragments(createDefaultSerieFragments());

        expect(fragments).toEqual([
            {
                id: "1",
                content: "",
                reference: [],
                cover: undefined,
                video: undefined,
                durationSec: undefined,
            },
        ]);
    });

    it("解析分镜数组", () => {
        const fragments = parseSerieFragments([
            {
                id: "2",
                content: "主角走进房间",
                reference: [{ assetId: 1 }],
                cover: "https://cdn.example.com/frame.jpg",
                video: "https://cdn.example.com/clip.mp4",
                durationSec: 12,
            },
        ]);

        expect(fragments).toEqual([
            {
                id: "2",
                content: "主角走进房间",
                reference: [{ assetId: 1 }],
                cover: "https://cdn.example.com/frame.jpg",
                video: "https://cdn.example.com/clip.mp4",
                durationSec: 12,
            },
        ]);
    });

    it("兼容 description 字段", () => {
        const fragments = parseSerieFragments([
            {
                description: "旧字段描述",
            },
        ]);

        expect(fragments[0]?.content).toBe("旧字段描述");
    });

    it("非数组时返回空列表", () => {
        expect(parseSerieFragments(null)).toEqual([]);
    });
});

describe("resolveInitialFragmentId", () => {
    // sampleFragments 测试用分镜
    const sampleFragments = parseSerieFragments([
        { id: "1", content: "a" },
        { id: "2", content: "b" },
    ]);

    it("按 fragment_id 选中分镜", () => {
        expect(resolveInitialFragmentId(sampleFragments, "2")).toBe("2");
    });

    it("未传参时默认选中第一个分镜", () => {
        expect(resolveInitialFragmentId(sampleFragments, null)).toBe("1");
    });
});

describe("formatSerieFragmentLabel", () => {
    it("带时长时格式化为片段 01 · 14s", () => {
        expect(formatSerieFragmentLabel(0, 14)).toBe("片段 01 · 14s");
    });

    it("无时长时仅显示片段序号", () => {
        expect(formatSerieFragmentLabel(7)).toBe("片段 08");
    });
});

describe("resolveSerieFragmentDisplayLabel", () => {
    it("使用 duration_sec 展示时长", () => {
        expect(
            resolveSerieFragmentDisplayLabel(
                {
                    id: "3",
                    content: "开场 @duration:5",
                    reference: [],
                    durationSec: 12,
                },
                2,
            ),
        ).toBe("片段 03 · 12s");
    });

    it("无 duration_sec 时不展示秒数", () => {
        expect(
            resolveSerieFragmentDisplayLabel(
                {
                    id: "3",
                    content: "开场 @duration:5",
                    reference: [],
                },
                2,
            ),
        ).toBe("片段 03");
    });
});

describe("resolveSerieFragmentDurationSeconds", () => {
    it("仅读取 duration_sec 字段", () => {
        expect(
            resolveSerieFragmentDurationSeconds({
                durationSec: 10,
            }),
        ).toBe(10);
    });
});

describe("serializeSerieFragments", () => {
    it("将分镜列表序列化为后端 JSON 结构", () => {
        expect(
            serializeSerieFragments([
                {
                    id: "1",
                    content: "hello",
                    reference: [],
                    cover: "",
                    video: "",
                    durationSec: 10,
                },
            ]),
        ).toEqual([
            {
                id: "1",
                content: "hello",
                reference: [],
                cover: "",
                video: "",
                durationSec: 10,
            },
        ]);
    });
});
