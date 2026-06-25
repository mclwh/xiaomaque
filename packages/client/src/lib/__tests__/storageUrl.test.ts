import { describe, expect, it } from "vitest";
import {
    appendQiniuImagePreviewProcessing,
    isLikelyImageStoragePath,
    resolveStoragePreviewUrl,
} from "@/lib/storageUrl";

describe("storageUrl qiniu image preview", () => {
    it("识别常见图片扩展名", () => {
        expect(isLikelyImageStoragePath("/xiaomaque/a.jpg")).toBe(true);
        expect(isLikelyImageStoragePath("https://cdn.example.com/a.webp?e=1")).toBe(true);
        expect(isLikelyImageStoragePath("/xiaomaque/a.mp4")).toBe(false);
    });

    it("为图片 URL 追加 imageView2 质量与宽度限制", () => {
        const url = "https://cdn.example.com/a.png";

        expect(appendQiniuImagePreviewProcessing(url)).toBe(
            "https://cdn.example.com/a.png?imageView2/2/w/1920/q/75",
        );
    });

    it("已带 query 的图片 URL 使用 & 连接处理参数", () => {
        const url = "https://cdn.example.com/a.jpg?e=123&token=abc";

        expect(appendQiniuImagePreviewProcessing(url)).toBe(
            "https://cdn.example.com/a.jpg?e=123&token=abc&imageView2/2/w/1920/q/75",
        );
    });

    it("非图片与已处理的 URL 不再追加", () => {
        const video = "https://cdn.example.com/a.mp4";
        const processed = "https://cdn.example.com/a.jpg?imageView2/2/w/200/q/60";

        expect(appendQiniuImagePreviewProcessing(video)).toBe(video);
        expect(appendQiniuImagePreviewProcessing(processed)).toBe(processed);
    });

    it("resolveStoragePreviewUrl 对完整图片 URL 追加预览参数", () => {
        expect(
            resolveStoragePreviewUrl("https://cdn.example.com/cover.jpeg"),
        ).toBe("https://cdn.example.com/cover.jpeg?imageView2/2/w/1920/q/75");
    });
});
