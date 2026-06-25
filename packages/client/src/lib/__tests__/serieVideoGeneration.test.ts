import { describe, expect, it } from "vitest";
import {
    buildSerieParamsWithVideoGeneration,
    resolveSerieVideoGenerationDefaults,
} from "@/lib/serieVideoGeneration";

describe("serieVideoGeneration", () => {
    it("无保存值时使用 Seedance 默认参数", () => {
        expect(resolveSerieVideoGenerationDefaults(null)).toEqual({
            modelId: "seedance-2",
            aspectRatio: "9:16",
            resolution: "480p",
        });
    });

    it("读取并校验 params.videoGeneration", () => {
        expect(
            resolveSerieVideoGenerationDefaults({
                videoGeneration: {
                    modelId: "seedance-2-fast",
                    aspectRatio: "16:9",
                    resolution: "720p",
                    videoStyleId: "pixel-art",
                },
            }),
        ).toEqual({
            modelId: "seedance-2-fast",
            aspectRatio: "16:9",
            resolution: "720p",
            videoStyleId: "pixel-art",
        });
    });

    it("合并写入 SerieParams", () => {
        expect(
            buildSerieParamsWithVideoGeneration(
                { subtitle: "第一集" },
                {
                    modelId: "seedance-2",
                    aspectRatio: "9:16",
                    resolution: "480p",
                },
            ),
        ).toEqual({
            subtitle: "第一集",
            videoGeneration: {
                modelId: "seedance-2",
                aspectRatio: "9:16",
                resolution: "480p",
            },
        });
    });
});
