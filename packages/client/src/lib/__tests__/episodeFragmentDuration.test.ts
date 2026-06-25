import { describe, expect, it } from "vitest";
import {
    canReplaceFragmentDurationInContent,
    extractDurationSecondsFromFragmentContent,
    resolveFragmentDurationAddError,
    resolveFragmentDurationReplaceError,
    sumFragmentContentDurationSeconds,
    validateFragmentContentDurationTotal,
} from "@/lib/episodeFragmentDuration";

describe("episodeFragmentDuration", () => {
    it("解析并合计时长标签", () => {
        const content = "开场 @duration:2 中间 @duration:5 结尾";

        expect(extractDurationSecondsFromFragmentContent(content)).toEqual([2, 5]);
        expect(sumFragmentContentDurationSeconds(content)).toBe(7);
    });

    it("合计超过 15 秒时校验失败", () => {
        const result = validateFragmentContentDurationTotal(
            "@duration:10 旁白 @duration:6",
        );

        expect(result.valid).toBe(false);
        expect(result.total).toBe(16);
    });

    it("合计在 15 秒内时校验通过", () => {
        const result = validateFragmentContentDurationTotal("@duration:5 @duration:10");

        expect(result).toEqual({ valid: true, total: 15 });
    });

    it("替换单个时长标签时校验合计上限", () => {
        expect(canReplaceFragmentDurationInContent("@duration:5 @duration:5", 5, 10)).toBe(true);
        expect(canReplaceFragmentDurationInContent("@duration:10 @duration:5", 5, 11)).toBe(false);
    });

    it("返回替换时长失败时的提示文案", () => {
        expect(resolveFragmentDurationReplaceError("@duration:10 @duration:5", 5, 6)).toBe(
            "镜头时长合计不能超过 15 秒（当前 16s）",
        );
        expect(resolveFragmentDurationReplaceError("@duration:5", 5, 0)).toBe("请输入有效时长");
    });

    it("返回新增时长失败时的提示文案", () => {
        expect(resolveFragmentDurationAddError(10, 6)).toBe(
            "镜头时长合计不能超过 15 秒（当前 16s）",
        );
        expect(resolveFragmentDurationAddError(5, 0)).toBe("请输入有效时长");
    });
});
