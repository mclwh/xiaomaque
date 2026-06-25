import { extractDurationSecondsFromFragmentContent } from "@/lib/episodeFragmentDuration";

// FragmentVideoTimelineSegment 视频时间轴上的脚本片段区间
export type FragmentVideoTimelineSegment = {
    index: number;
    durationSec: number;
    startSec: number;
    endSec: number;
};

// 根据脚本 @duration 与视频总时长构建分段进度条区间
export function buildFragmentVideoTimelineSegments(
    content: string,
    videoDurationSec: number,
): FragmentVideoTimelineSegment[] {
    const contentDurations = extractDurationSecondsFromFragmentContent(content);
    const contentTotal = contentDurations.reduce((sum, value) => sum + value, 0);
    const resolvedTotal =
        videoDurationSec > 0
            ? videoDurationSec
            : contentTotal > 0
              ? contentTotal
              : 0;

    if (resolvedTotal <= 0) {
        return [];
    }

    if (contentDurations.length === 0) {
        return [
            {
                index: 0,
                durationSec: resolvedTotal,
                startSec: 0,
                endSec: resolvedTotal,
            },
        ];
    }

    const scale = contentTotal > 0 ? resolvedTotal / contentTotal : 1;
    let cursor = 0;

    return contentDurations.map((durationSec, index) => {
        const scaledDuration = durationSec * scale;
        const startSec = cursor;
        const endSec = cursor + scaledDuration;

        cursor = endSec;

        return {
            index,
            durationSec: scaledDuration,
            startSec,
            endSec,
        };
    });
}

// 解析当前播放时间所在的片段索引
export function resolveActiveFragmentVideoSegmentIndex(
    segments: FragmentVideoTimelineSegment[],
    currentTimeSec: number,
): number {
    if (segments.length === 0) {
        return 0;
    }

    const matched = segments.find(
        (segment) => currentTimeSec >= segment.startSec && currentTimeSec < segment.endSec,
    );

    return matched?.index ?? segments[segments.length - 1]?.index ?? 0;
}

// 计算单个片段内的已播放比例（0–1）
export function resolveSegmentFillRatio(
    segment: FragmentVideoTimelineSegment,
    currentTimeSec: number,
): number {
    if (currentTimeSec >= segment.endSec) {
        return 1;
    }

    if (currentTimeSec <= segment.startSec) {
        return 0;
    }

    const span = segment.endSec - segment.startSec;

    if (span <= 0) {
        return 0;
    }

    return (currentTimeSec - segment.startSec) / span;
}

// 将秒数格式化为 mm:ss
export function formatVideoTimelineClock(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
}

// 将进度条点击比例映射为播放时间
export function resolveVideoTimelineSeekTime(ratio: number, totalDurationSec: number): number {
    if (totalDurationSec <= 0) {
        return 0;
    }

    const clampedRatio = Math.min(1, Math.max(0, ratio));

    return clampedRatio * totalDurationSec;
}
