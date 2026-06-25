import { describe, expect, it } from "vitest";
import {
    buildEpisodeVideoTimelineSegments,
    formatVideoTimelineClock,
    resolveEpisodeTimelineSegmentFillRatio,
    resolveEpisodeVideoTimelineTotalDuration,
    resolveFragmentPlaybackFromGlobalTime,
    resolveGlobalTimeFromFragmentPlayback,
    resolveNextPlayableFragmentId,
} from "@/lib/episodeVideoTimeline";
import type { SerieFragment } from "@/lib/serieFragments";

function createFragment(
    partial: Partial<SerieFragment> & Pick<SerieFragment, "id">,
): SerieFragment {
    return {
        content: "",
        reference: [],
        ...partial,
    };
}

describe("buildEpisodeVideoTimelineSegments", () => {
    it("按分镜 duration_sec 顺序构建多段进度条", () => {
        const segments = buildEpisodeVideoTimelineSegments([
            createFragment({
                id: "1",
                durationSec: 10,
                video: "a.mp4",
            }),
            createFragment({
                id: "2",
                durationSec: 15,
                video: "b.mp4",
            }),
        ]);

        expect(segments).toHaveLength(2);
        expect(segments[0]).toMatchObject({
            fragmentId: "1",
            startSec: 0,
            endSec: 10,
            durationSec: 10,
        });
        expect(segments[1]).toMatchObject({
            fragmentId: "2",
            startSec: 10,
            endSec: 25,
            durationSec: 15,
        });
        expect(resolveEpisodeVideoTimelineTotalDuration(segments)).toBe(25);
    });
});

describe("resolveGlobalTimeFromFragmentPlayback", () => {
    it("将分镜内播放进度映射到全局时间", () => {
        const segment = {
            fragmentId: "2",
            index: 1,
            durationSec: 8,
            startSec: 5,
            endSec: 13,
            hasVideo: true,
        };

        expect(resolveGlobalTimeFromFragmentPlayback(segment, 4, 8)).toBe(9);
    });
});

describe("resolveFragmentPlaybackFromGlobalTime", () => {
    it("将全局时间映射回分镜内播放位置", () => {
        const segments = buildEpisodeVideoTimelineSegments([
            createFragment({ id: "1", durationSec: 10, video: "a.mp4" }),
            createFragment({ id: "2", durationSec: 15, video: "b.mp4" }),
        ]);

        expect(resolveFragmentPlaybackFromGlobalTime(segments, 14)).toEqual({
            segment: segments[1],
            localTimeSec: 4,
        });
    });
});

describe("resolveEpisodeTimelineSegmentFillRatio", () => {
    it("按全局时间计算分镜区间填充比例", () => {
        const segment = {
            fragmentId: "2",
            index: 1,
            durationSec: 8,
            startSec: 5,
            endSec: 13,
            hasVideo: true,
        };

        expect(resolveEpisodeTimelineSegmentFillRatio(segment, 9)).toBe(0.5);
    });
});

describe("resolveNextPlayableFragmentId", () => {
    it("返回下一个有视频的分镜", () => {
        const segments = buildEpisodeVideoTimelineSegments([
            createFragment({ id: "1", durationSec: 10, video: "a.mp4" }),
            createFragment({ id: "2", durationSec: 3 }),
            createFragment({ id: "3", durationSec: 4, video: "c.mp4" }),
        ]);

        expect(resolveNextPlayableFragmentId(segments, "1")).toBe("3");
    });
});

describe("formatVideoTimelineClock", () => {
    it("格式化为 mm:ss", () => {
        expect(formatVideoTimelineClock(89)).toBe("01:29");
    });
});
