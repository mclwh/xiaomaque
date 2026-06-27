import { EPISODE_CONTENT_BATCH_MAX } from "./constants.js";

// EpisodeBatchRange 单批次集数范围（闭区间）
export type EpisodeBatchRange = {
    start: number;
    end: number;
};

/**
 * 将总集数拆分为每批最多 12 集的生成范围
 * @param episodeCount 总集数
 */
export function buildEpisodeBatchRanges(episodeCount: number): EpisodeBatchRange[] {
    const batches: EpisodeBatchRange[] = [];

    for (let start = 1; start <= episodeCount; start += EPISODE_CONTENT_BATCH_MAX) {
        const end = Math.min(start + EPISODE_CONTENT_BATCH_MAX - 1, episodeCount);
        batches.push({ start, end });
    }

    return batches;
}

// 返回批次应生成的集数
export function getEpisodeBatchSize(range: EpisodeBatchRange): number {
    return range.end - range.start + 1;
}
