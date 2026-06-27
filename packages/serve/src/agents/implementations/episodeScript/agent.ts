import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createChatModel } from "../../llm.js";
import { getEpisodeBatchSize, type EpisodeBatchRange } from "./batch.js";
import {
    buildEpisodeBatchContentUserMessage,
    buildEpisodeOutlineUserMessage,
} from "./buildUserMessage.js";
import { EPISODE_SCRIPT_AGENT_ID, EPISODE_SCRIPT_AGENT_NAME } from "./constants.js";
import { EPISODE_BATCH_CONTENT_SYSTEM_PROMPT, EPISODE_OUTLINE_SYSTEM_PROMPT } from "./prompt.js";
import { episodeBatchContentSchema, episodeOutlineSchema } from "./schema.js";
import type {
    EpisodeBatchContentAgentInput,
    EpisodeBatchContentAgentOutput,
    EpisodeBatchContentItem,
    EpisodeOutlineAgentInput,
    EpisodeOutlineAgentOutput,
    EpisodeOutlineItem,
} from "./types.js";

/**
 * 分集剧本 Agent：先生成全剧分集大纲，再按批（每批最多 12 集）生成剧本正文
 */

// 校验分集大纲数量与连续性
function assertEpisodeOutline(
    episodes: EpisodeOutlineItem[],
    episodeCount: number,
): EpisodeOutlineItem[] {
    if (episodes.length !== episodeCount) {
        throw new Error(
            `分集大纲数量不符：期望 ${episodeCount} 集，实际 ${episodes.length} 集`,
        );
    }

    const sorted = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);

    for (let index = 0; index < sorted.length; index += 1) {
        const expectedNumber = index + 1;
        const item = sorted[index];

        if (item.episodeNumber !== expectedNumber) {
            throw new Error(`分集序号不连续：缺少第 ${expectedNumber} 集`);
        }

        if (!item.title.trim()) {
            throw new Error(`第 ${expectedNumber} 集名称为空`);
        }
    }

    return sorted;
}

// 校验批次正文数量与集数序号
function assertEpisodeBatchContent(
    episodes: EpisodeBatchContentItem[],
    range: EpisodeBatchRange,
): EpisodeBatchContentItem[] {
    const expectedSize = getEpisodeBatchSize(range);

    if (episodes.length !== expectedSize) {
        throw new Error(
            `批次正文数量不符：期望 ${expectedSize} 集（第 ${range.start}–${range.end} 集），实际 ${episodes.length} 集`,
        );
    }

    const sorted = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);

    for (let episodeNumber = range.start; episodeNumber <= range.end; episodeNumber += 1) {
        const item = sorted[episodeNumber - range.start];

        if (!item || item.episodeNumber !== episodeNumber) {
            throw new Error(`批次正文缺少第 ${episodeNumber} 集`);
        }

        if (!item.content.trim()) {
            throw new Error(`第 ${episodeNumber} 集正文为空`);
        }
    }

    return sorted;
}

/**
 * 生成全部分集的集数与名称大纲
 * @param input 原始创意、剧本摘要与总集数
 */
export async function runEpisodeOutlineAgent(
    input: EpisodeOutlineAgentInput,
): Promise<EpisodeOutlineAgentOutput> {
    const model = createChatModel(1);
    const structuredModel = model.withStructuredOutput(episodeOutlineSchema, {
        name: "episode_outline",
    });

    const result = await structuredModel.invoke([
        new SystemMessage(EPISODE_OUTLINE_SYSTEM_PROMPT),
        new HumanMessage(buildEpisodeOutlineUserMessage(input)),
    ]);

    const episodes = assertEpisodeOutline(result.episodes, input.episodeCount);

    return {
        agentId: EPISODE_SCRIPT_AGENT_ID,
        agentName: EPISODE_SCRIPT_AGENT_NAME,
        episodes,
    };
}

/**
 * 批量生成连续多集剧本正文（单次最多 12 集）
 * @param input 批次上下文，须含原始创意、剧本摘要与已有剧集正文
 */
export async function runEpisodeBatchContentAgent(
    input: EpisodeBatchContentAgentInput,
): Promise<EpisodeBatchContentAgentOutput> {
    const model = createChatModel(1);
    const structuredModel = model.withStructuredOutput(episodeBatchContentSchema, {
        name: "episode_batch_content",
    });

    const result = await structuredModel.invoke([
        new SystemMessage(EPISODE_BATCH_CONTENT_SYSTEM_PROMPT),
        new HumanMessage(buildEpisodeBatchContentUserMessage(input)),
    ]);

    const episodes = assertEpisodeBatchContent(result.episodes, {
        start: input.batchStart,
        end: input.batchEnd,
    });

    return {
        episodes: episodes.map((item) => ({
            episodeNumber: item.episodeNumber,
            content: item.content.trim(),
        })),
    };
}
