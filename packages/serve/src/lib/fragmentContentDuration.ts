// 分镜脚本内 @duration 标签解析（与前端 episodeFragmentDuration 一致）

// FRAGMENT_CONTENT_DURATION_MAX 时长标签合计上限（秒）
export const FRAGMENT_CONTENT_DURATION_MAX = 15;

// SEEDANCE_SMART_DURATION Seedance 智能时长（由模型自动选择）
export const SEEDANCE_SMART_DURATION = -1;

// DURATION_MENTION_TOKEN_PATTERN 内容中时长标签占位符
const DURATION_MENTION_TOKEN_PATTERN = /@duration:(\d+)/g;

// 从 content 提取全部时长秒数
export function extractDurationSecondsFromFragmentContent(content: string): number[] {
    const durations: number[] = [];

    for (const match of content.matchAll(DURATION_MENTION_TOKEN_PATTERN)) {
        const seconds = Number(match[1]);

        if (Number.isFinite(seconds) && seconds > 0) {
            durations.push(seconds);
        }
    }

    return durations;
}

// 统计 content 中时长标签合计秒数
export function sumFragmentContentDurationSeconds(content: string): number {
    return extractDurationSecondsFromFragmentContent(content).reduce((sum, value) => sum + value, 0);
}

// 将秒数格式化为 MM:SS 时间戳
function formatDurationTimestamp(seconds: number): string {
    // minutes 分钟部分
    const minutes = Math.floor(seconds / 60);
    // secs 秒部分
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// 将 content 中的 @duration 标签按出现顺序替换为渐进时间区间（如 00:00-00:05）
export function replaceDurationMentionsWithTimeRanges(content: string): string {
    // elapsedSeconds 已累计的秒数，作为下一区间的起点
    let elapsedSeconds = 0;

    return content.replace(DURATION_MENTION_TOKEN_PATTERN, (_match, secondsRaw: string) => {
        const seconds = Number(secondsRaw);

        if (!Number.isFinite(seconds) || seconds <= 0) {
            return " ";
        }

        // rangeStart 当前区间起点秒数
        const rangeStart = elapsedSeconds;
        // rangeEnd 当前区间终点秒数
        const rangeEnd = elapsedSeconds + seconds;
        elapsedSeconds = rangeEnd;

        return `${formatDurationTimestamp(rangeStart)}-${formatDurationTimestamp(rangeEnd)}`;
    });
}

/**
 * 解析提交 Seedance 的 duration 参数
 * 无 @duration 标签时为 -1（智能时长）；有则合计并封顶 15 秒
 * @param content 分镜脚本文案
 * @returns -1 或 1–15 的整数秒
 */
export function resolveSeedanceDurationFromContent(content: string | undefined): number {
    const durations = extractDurationSecondsFromFragmentContent(content ?? "");

    if (durations.length === 0) {
        return SEEDANCE_SMART_DURATION;
    }

    const total = durations.reduce((sum, value) => sum + value, 0);

    return Math.min(total, FRAGMENT_CONTENT_DURATION_MAX);
}
