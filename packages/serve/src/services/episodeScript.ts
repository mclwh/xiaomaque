import { buildEpisodeBatchRanges } from "../agents/implementations/episodeScript/batch.js";
import {
    runEpisodeBatchContentAgent,
    runEpisodeOutlineAgent,
} from "../agents/implementations/episodeScript/agent.js";
import { EPISODE_SCRIPT_AGENT_ID, EPISODE_SCRIPT_AGENT_NAME } from "../agents/implementations/episodeScript/constants.js";
import type {
    EpisodeScriptResult,
    SerieEpisodeItem,
} from "../agents/implementations/episodeScript/types.js";
import { SUMMARY_STATUS } from "../validators/script.js";
import { scriptService } from "./script.js";

/**
 * 分集剧本服务：基于原始创意与剧本摘要，按批生成全部分集正文
 */
export class EpisodeScriptService {
    /**
     * 为项目生成全部分集剧本并写入 serie_content
     * @param userId 当前用户 ID
     * @param projectId 项目 ID
     */
    async generateEpisodes(userId: number, projectId: number): Promise<EpisodeScriptResult> {
        const script = await scriptService.getByProjectId(userId, projectId);

        if (!script.summary) {
            throw new Error("剧本摘要尚未生成，无法生成分集剧本");
        }

        if (!script.source?.trim()) {
            throw new Error("原始创意为空，无法生成分集剧本");
        }

        const episodeCount = script.episodeCount ?? script.summary.episodeCount;

        if (!episodeCount || episodeCount < 1) {
            throw new Error("集数无效，无法生成分集剧本");
        }

        if (
            script.serieContentStatus === SUMMARY_STATUS.COMPLETED &&
            script.serieContent &&
            script.serieContent.every((item) => item.status === "completed" && item.content)
        ) {
            return {
                agentId: EPISODE_SCRIPT_AGENT_ID,
                agentName: EPISODE_SCRIPT_AGENT_NAME,
                episodes: script.serieContent,
                projectId: script.projectId,
                scriptId: script.id,
            };
        }

        await scriptService.markSerieContentGenerating(userId, projectId);

        try {
            const outline = await runEpisodeOutlineAgent({
                creative: script.source,
                summary: script.summary,
                episodeCount,
            });

            await scriptService.applyEpisodeOutline(userId, projectId, outline.episodes);

            const episodes: SerieEpisodeItem[] = [];
            const batches = buildEpisodeBatchRanges(episodeCount);

            for (const batch of batches) {
                for (let episodeNumber = batch.start; episodeNumber <= batch.end; episodeNumber += 1) {
                    await scriptService.markEpisodeGenerating(userId, projectId, episodeNumber);
                }

                try {
                    const batchResult = await runEpisodeBatchContentAgent({
                        creative: script.source,
                        summary: script.summary,
                        episodeCount,
                        batchStart: batch.start,
                        batchEnd: batch.end,
                        allEpisodeTitles: outline.episodes,
                        existingEpisodes: episodes,
                    });

                    for (const item of batchResult.episodes) {
                        const outlineItem = outline.episodes.find(
                            (episode) => episode.episodeNumber === item.episodeNumber,
                        );

                        await scriptService.updateEpisodeContent(
                            userId,
                            projectId,
                            item.episodeNumber,
                            item.content,
                            "completed",
                        );

                        episodes.push({
                            episodeNumber: item.episodeNumber,
                            title: outlineItem?.title ?? `第 ${item.episodeNumber} 集`,
                            content: item.content,
                            status: "completed",
                        });
                    }
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : "批次剧本生成失败";

                    for (let episodeNumber = batch.start; episodeNumber <= batch.end; episodeNumber += 1) {
                        await scriptService.updateEpisodeContent(
                            userId,
                            projectId,
                            episodeNumber,
                            "",
                            "failed",
                        );
                    }

                    throw new Error(
                        `第 ${batch.start}–${batch.end} 集生成失败：${message}`,
                    );
                }
            }

            await scriptService.markSerieContentCompleted(userId, projectId);

            return {
                agentId: EPISODE_SCRIPT_AGENT_ID,
                agentName: EPISODE_SCRIPT_AGENT_NAME,
                episodes,
                projectId: script.projectId,
                scriptId: script.id,
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "分集剧本生成失败，请稍后重试";

            await scriptService.markSerieContentFailed(userId, projectId, message);
            throw error;
        }
    }
}

// episodeScriptService 分集剧本服务单例
export const episodeScriptService = new EpisodeScriptService();
