import { describe, expect, it } from "vitest";
import {
    buildFragmentVideoTimelineSegments,
    formatVideoTimelineClock,
    resolveActiveFragmentVideoSegmentIndex,
    resolveSegmentFillRatio,
} from "@/lib/fragmentVideoTimeline";

describe("buildFragmentVideoTimelineSegments", () => {
    it("无 @duration 时生成单段进度条", () => {
        expect(buildFragmentVideoTimelineSegments("纯文本", 12)).toEqual([
            {
                index: 0,
                durationSec: 12,
                startSec: 0,
                endSec: 12,
            },
        ]);
    });

    it("按 @duration 比例切分视频时长", () => {
        const segments = buildFragmentVideoTimelineSegments(
            "开场 @duration:5 转场 @duration:5",
            10,
        );

        expect(segments).toHaveLength(2);
        expect(segments[0]).toMatchObject({ startSec: 0, endSec: 5 });
        expect(segments[1]).toMatchObject({ startSec: 5, endSec: 10 });
    });
});

describe("resolveActiveFragmentVideoSegmentIndex", () => {
    const segments = buildFragmentVideoTimelineSegments("@duration:4 @duration:6", 10);

    it("返回当前时间所在片段", () => {
        expect(resolveActiveFragmentVideoSegmentIndex(segments, 3)).toBe(0);
        expect(resolveActiveFragmentVideoSegmentIndex(segments, 7)).toBe(1);
    });
});

describe("resolveSegmentFillRatio", () => {
    it("按片段内进度计算填充比例", () => {
        const segment = {
            index: 0,
            durationSec: 10,
            startSec: 0,
            endSec: 10,
        };

        expect(resolveSegmentFillRatio(segment, 5)).toBe(0.5);
        expect(resolveSegmentFillRatio(segment, 10)).toBe(1);
    });
});

describe("formatVideoTimelineClock", () => {
    it("格式化为 mm:ss", () => {
        expect(formatVideoTimelineClock(89)).toBe("01:29");
    });
});
