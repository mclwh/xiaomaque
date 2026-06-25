// SerieFragmentParams 分镜 params 扩展字段
export type SerieFragmentParams = {
    // lastFrame 生成视频尾帧在七牛的存储 key（用于续拍衔接）
    lastFrame?: string;
};

// 读取分镜 params 中的尾帧 key
export function readSerieFragmentLastFrameKey(params: unknown): string | null {
    if (!params || typeof params !== "object" || Array.isArray(params)) {
        return null;
    }

    const lastFrame = (params as SerieFragmentParams).lastFrame;

    return typeof lastFrame === "string" && lastFrame.trim().length > 0 ? lastFrame.trim() : null;
}

// 合并分镜 params（保留已有字段）
export function mergeSerieFragmentParams(
    current: unknown,
    patch: SerieFragmentParams,
): SerieFragmentParams {
    const base =
        current && typeof current === "object" && !Array.isArray(current)
            ? (current as Record<string, unknown>)
            : {};

    return {
        ...base,
        ...patch,
    };
}
