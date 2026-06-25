// 分集分镜片段
export type SerieFragmentParams = {
    lastFrame?: string;
};

export type SerieFragment = {
    id: string;
    content: string;
    reference: unknown[];
    cover?: string;
    video?: string;
    durationSec?: number;
    params?: SerieFragmentParams;
};

// 解析分镜 reference 数组
function parseSerieFragmentReference(reference: unknown): unknown[] {
    if (!Array.isArray(reference)) {
        return [];
    }

    return reference;
}

// 解析分镜 content 文案（兼容 description / prompt）
function parseSerieFragmentContent(raw: Record<string, unknown>): string {
    if (typeof raw.content === "string") {
        return raw.content;
    }

    if (typeof raw.description === "string") {
        return raw.description;
    }

    if (typeof raw.prompt === "string") {
        return raw.prompt;
    }

    return "";
}

// 解析分集 fragments 为分镜列表
export function parseSerieFragments(fragments: unknown): SerieFragment[] {
    if (!Array.isArray(fragments)) {
        return [];
    }

    return fragments.flatMap((item, index) => {
        if (!item || typeof item !== "object") {
            return [];
        }

        // raw 原始分镜对象
        const raw = item as Record<string, unknown>;
        // id 分镜唯一标识（数据库为数字 ID）
        const id = String(raw.id ?? index + 1);
        // cover 分镜封面（生成视频后取首帧）
        const cover = typeof raw.cover === "string" ? raw.cover : undefined;
        // video 分镜视频地址
        const video =
            typeof raw.video === "string"
                ? raw.video
                : typeof raw.video_url === "string"
                  ? raw.video_url
                  : typeof raw.videoUrl === "string"
                    ? raw.videoUrl
                    : undefined;
        // params 分镜扩展字段（如尾帧 lastFrame）
        const paramsRaw = raw.params;
        const params =
            paramsRaw && typeof paramsRaw === "object" && !Array.isArray(paramsRaw)
                ? {
                      lastFrame:
                          typeof (paramsRaw as Record<string, unknown>).lastFrame === "string"
                              ? ((paramsRaw as Record<string, unknown>).lastFrame as string)
                              : undefined,
                  }
                : undefined;

        return [
            {
                id,
                content: parseSerieFragmentContent(raw),
                reference: parseSerieFragmentReference(raw.reference),
                cover: cover && cover.length > 0 ? cover : undefined,
                video: video && video.length > 0 ? video : undefined,
                ...(params?.lastFrame ? { params } : {}),
                durationSec:
                    typeof raw.durationSec === "number"
                        ? raw.durationSec
                        : typeof raw.duration === "number"
                          ? raw.duration
                          : undefined,
            },
        ];
    });
}

// 解析分镜用于展示的封面 key（优先 cover，其次 params.lastFrame）
export function resolveSerieFragmentCoverKey(fragment: Pick<SerieFragment, "cover" | "params">): string | null {
    if (fragment.cover) {
        return fragment.cover;
    }

    const lastFrame = fragment.params?.lastFrame;

    return lastFrame && lastFrame.length > 0 ? lastFrame : null;
}

// 新建分集默认 fragments 结构
export function createDefaultSerieFragments(): Array<{
    content: string;
    reference: unknown[];
    cover: string;
    video: string;
}> {
    return [
        {
            content: "",
            reference: [],
            cover: "",
            video: "",
        },
    ];
}

// 解析分镜数据库 ID（临时客户端 ID 如 fragment-xxx 返回 null）
export function parseSerieFragmentDbId(raw: unknown): number | null {
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
        return Math.trunc(raw);
    }

    if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
        return Number(raw.trim());
    }

    return null;
}

// 根据 URL 中的 fragment_id 解析默认选中的分镜 ID
export function resolveInitialFragmentId(
    fragments: SerieFragment[],
    preferredFragmentId?: string | null,
): string | null {
    if (fragments.length === 0) {
        return null;
    }

    if (!preferredFragmentId) {
        return fragments[0]?.id ?? null;
    }

    const matched = fragments.find((fragment) => fragment.id === preferredFragmentId);

    return matched?.id ?? fragments[0]?.id ?? null;
}

// 格式化底部分镜条目标签（片段 01 · 14s）
export function formatSerieFragmentLabel(index: number, durationSec?: number): string {
    // order 两位序号
    const order = String(index + 1).padStart(2, "0");

    if (durationSec !== undefined) {
        return `片段 ${order} · ${durationSec}s`;
    }

    return `片段 ${order}`;
}

// 解析分镜展示用时长（秒）：以数据库 duration_sec 为准
export function resolveSerieFragmentDurationSeconds(
    fragment: Pick<SerieFragment, "durationSec">,
): number | undefined {
    if (
        typeof fragment.durationSec === "number" &&
        Number.isFinite(fragment.durationSec) &&
        fragment.durationSec > 0
    ) {
        return Math.trunc(fragment.durationSec);
    }

    return undefined;
}

// 返回分镜在 UI 上的展示标签
export function resolveSerieFragmentDisplayLabel(fragment: SerieFragment, index: number): string {
    return formatSerieFragmentLabel(index, resolveSerieFragmentDurationSeconds(fragment));
}

// 创建空白分镜片段
export function createStoryboardFragment(partial?: Partial<SerieFragment>): SerieFragment {
    // id 分镜唯一标识
    const id =
        partial?.id ??
        `fragment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return {
        id,
        content: partial?.content ?? "",
        reference: partial?.reference ? [...partial.reference] : [],
        cover: partial?.cover,
        video: partial?.video,
        durationSec: partial?.durationSec,
    };
}

// 复制分镜片段（生成新 ID）
export function duplicateStoryboardFragment(fragment: SerieFragment): SerieFragment {
    return createStoryboardFragment({
        content: fragment.content,
        reference: [...fragment.reference],
        cover: fragment.cover,
        video: fragment.video,
        durationSec: fragment.durationSec,
    });
}

// 将分镜列表序列化为后端 fragments JSON
export function serializeSerieFragments(fragments: SerieFragment[]): Array<Record<string, unknown>> {
    return fragments.map((fragment) => ({
        id: fragment.id,
        content: fragment.content,
        reference: fragment.reference,
        cover: fragment.cover ?? "",
        video: fragment.video ?? "",
        ...(fragment.durationSec !== undefined ? { durationSec: fragment.durationSec } : {}),
    }));
}
