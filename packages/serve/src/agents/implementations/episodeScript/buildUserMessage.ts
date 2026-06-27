import { formatScriptSummaryText } from "../scriptSummary/format.js";
import type {
    EpisodeBatchContentAgentInput,
    EpisodeOutlineAgentInput,
    EpisodeOutlineItem,
    SerieEpisodeItem,
} from "./types.js";

// 格式化全部分集标题列表供 LLM 阅读
function formatEpisodeTitleList(episodes: EpisodeOutlineItem[]): string {
    return episodes
        .map((item) => `第 ${item.episodeNumber} 集：${item.title}`)
        .join("\n");
}

// 格式化已有剧集正文供上下文衔接
function formatExistingEpisodeContent(episodes: SerieEpisodeItem[]): string {
    const completed = episodes
        .filter((item) => item.status === "completed" && item.content.trim())
        .sort((a, b) => a.episodeNumber - b.episodeNumber);

    if (completed.length === 0) {
        return "（暂无，本批次从开篇写起）";
    }

    return completed
        .map((item) => `${item.episodeNumber}.${item.title}：\n${item.content.trim()}`)
        .join("\n\n");
}

// 格式化本批次待生成的集数与名称
function formatBatchEpisodeTitles(
    allEpisodeTitles: EpisodeOutlineItem[],
    batchStart: number,
    batchEnd: number,
): string {
    return allEpisodeTitles
        .filter((item) => item.episodeNumber >= batchStart && item.episodeNumber <= batchEnd)
        .map((item) => `第 ${item.episodeNumber} 集：${item.title}`)
        .join("\n");
}

/**
 * 构建分集大纲 Agent 用户消息
 * @param input 原始创意、剧本摘要与总集数
 */
export function buildEpisodeOutlineUserMessage(input: EpisodeOutlineAgentInput): string {
    const summaryText = formatScriptSummaryText(input.summary);

    return [
        `总集数：${input.episodeCount} 集（episodes 数组必须恰好 ${input.episodeCount} 项）`,
        "",
        `原始创意：\n${input.creative.trim()}`,
        "",
        `剧本摘要：\n${summaryText}`,
        "",
        "请输出全部分集的 episodeNumber 与 title。",
    ].join("\n");
}

/**
 * 构建批次正文 Agent 用户消息
 * @param input 批次生成上下文（含原始创意、摘要与已有剧集）
 */
export function buildEpisodeBatchContentUserMessage(input: EpisodeBatchContentAgentInput): string {
    const summaryText = formatScriptSummaryText(input.summary);
    const batchSize = input.batchEnd - input.batchStart + 1;

    return [
        `当前任务：撰写第 ${input.batchStart} 集至第 ${input.batchEnd} 集（共 ${batchSize} 集）的完整剧本正文`,
        `全剧共 ${input.episodeCount} 集`,
        `episodes 输出数组必须恰好 ${batchSize} 项，episodeNumber 从 ${input.batchStart} 到 ${input.batchEnd}`,
        "",
        `原始创意：\n${input.creative.trim()}`,
        "",
        `剧本摘要：\n${summaryText}`,
        "",
        `全剧分集规划：\n${formatEpisodeTitleList(input.allEpisodeTitles)}`,
        "",
        `本批次待撰写：\n${formatBatchEpisodeTitles(input.allEpisodeTitles, input.batchStart, input.batchEnd)}`,
        "",
        `已有剧集正文：\n${formatExistingEpisodeContent(input.existingEpisodes)}`,
        "",
        `请输出第 ${input.batchStart}–${input.batchEnd} 集各集的 content 字段。`,
    ].join("\n");
}
