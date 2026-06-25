// 分镜脚本内时长标签解析与校验

// FRAGMENT_CONTENT_DURATION_MAX 单条分镜脚本内时长标签合计上限（秒）
export const FRAGMENT_CONTENT_DURATION_MAX = 15;

// FRAGMENT_DURATION_PRESET_OPTIONS 时长快捷选项（秒）
export const FRAGMENT_DURATION_PRESET_OPTIONS = [2, 5, 10] as const;

// DURATION_MENTION_TOKEN_PATTERN 内容中时长标签占位符
const DURATION_MENTION_TOKEN_PATTERN = /@duration:(\d+)/g;

// 从 content 提取全部时长秒数（保留顺序）
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

// 校验单个时长值是否合法
export function isValidFragmentDurationSeconds(seconds: number): boolean {
    return Number.isFinite(seconds) && seconds > 0 && seconds <= FRAGMENT_CONTENT_DURATION_MAX;
}

// 校验 content 内时长标签合计是否不超过上限
export function validateFragmentContentDurationTotal(content: string): {
    valid: boolean;
    total: number;
    message?: string;
} {
    const durations = extractDurationSecondsFromFragmentContent(content);
    const total = durations.reduce((sum, value) => sum + value, 0);

    if (durations.some((value) => !isValidFragmentDurationSeconds(value))) {
        return {
            valid: false,
            total,
            message: `单个时长标签需在 1–${FRAGMENT_CONTENT_DURATION_MAX} 秒之间`,
        };
    }

    if (total > FRAGMENT_CONTENT_DURATION_MAX) {
        return {
            valid: false,
            total,
            message: `镜头时长合计不能超过 ${FRAGMENT_CONTENT_DURATION_MAX} 秒（当前 ${total}s）`,
        };
    }

    return { valid: true, total };
}

// 校验替换单个时长标签后合计是否合法
export function canReplaceFragmentDurationInContent(
    content: string,
    previousSeconds: number,
    nextSeconds: number,
): boolean {
    if (!isValidFragmentDurationSeconds(nextSeconds)) {
        return false;
    }

    const total = sumFragmentContentDurationSeconds(content) - previousSeconds + nextSeconds;

    return total <= FRAGMENT_CONTENT_DURATION_MAX;
}

// 解析替换单个时长标签时的错误文案（合法时返回 null）
export function resolveFragmentDurationReplaceError(
    content: string,
    previousSeconds: number,
    nextSeconds: number,
): string | null {
    if (!Number.isFinite(nextSeconds) || nextSeconds <= 0) {
        return "请输入有效时长";
    }

    if (!isValidFragmentDurationSeconds(nextSeconds)) {
        return `单个时长标签需在 1–${FRAGMENT_CONTENT_DURATION_MAX} 秒之间`;
    }

    const total = sumFragmentContentDurationSeconds(content) - previousSeconds + nextSeconds;

    if (total > FRAGMENT_CONTENT_DURATION_MAX) {
        return `镜头时长合计不能超过 ${FRAGMENT_CONTENT_DURATION_MAX} 秒（当前 ${total}s）`;
    }

    return null;
}

// 解析新增时长标签时的错误文案（合法时返回 null）
export function resolveFragmentDurationAddError(
    currentTotalSeconds: number,
    addSeconds: number,
): string | null {
    if (!Number.isFinite(addSeconds) || addSeconds <= 0) {
        return "请输入有效时长";
    }

    if (!isValidFragmentDurationSeconds(addSeconds)) {
        return `单个时长标签需在 1–${FRAGMENT_CONTENT_DURATION_MAX} 秒之间`;
    }

    const total = currentTotalSeconds + addSeconds;

    if (total > FRAGMENT_CONTENT_DURATION_MAX) {
        return `镜头时长合计不能超过 ${FRAGMENT_CONTENT_DURATION_MAX} 秒（当前 ${total}s）`;
    }

    return null;
}
