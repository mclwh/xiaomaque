import { runScriptSummaryAgent } from "../agents/implementations/scriptSummary/agent.js";
import type {
    ScriptSummaryAgentInput,
    ScriptSummaryResult,
} from "../agents/implementations/scriptSummary/types.js";
import { SUMMARY_STATUS } from "../validators/script.js";
import type { CreateScriptDraftInput, ScriptDraftRecord } from "./script.js";
import { scriptService } from "./script.js";

/**
 * 剧本摘要服务：草稿创建与异步摘要生成
 */
export class ScriptSummaryService {
    // 立即创建项目与剧本草稿
    async createDraft(
        userId: number,
        input: Omit<CreateScriptDraftInput, "userId">,
    ): Promise<ScriptDraftRecord> {
        return scriptService.createDraft({
            userId,
            creative: input.creative.trim(),
            episodeCount: input.episodeCount,
            imageStyleId: input.imageStyleId,
        });
    }

    /**
     * 为已有剧本生成摘要并写回数据库
     * @param userId 当前用户 ID
     * @param projectId 项目 ID
     */
    async generateSummary(userId: number, projectId: number): Promise<ScriptSummaryResult> {
        const script = await scriptService.getByProjectId(userId, projectId);

        if (script.summary && script.summaryStatus === SUMMARY_STATUS.COMPLETED) {
            return {
                agentId: "script-summary",
                agentName: "剧本摘要",
                summary: script.summary,
                text: script.summaryText ?? "",
                projectId: script.projectId,
                scriptId: script.id,
                projectTitle: script.name,
            };
        }

        if (!script.source?.trim()) {
            throw new Error("原始创意为空，无法生成剧本摘要");
        }

        await scriptService.markSummaryGenerating(userId, projectId);

        const agentInput: ScriptSummaryAgentInput = {
            creative: script.source,
            episodeCount: script.params.episodeCount,
            imageStyleId: script.params.imageStyleId,
        };

        try {
            const agentResult = await runScriptSummaryAgent(agentInput);
            const updated = await scriptService.applySummary({
                userId,
                projectId,
                summary: agentResult.summary,
                summaryText: agentResult.text,
            });

            return {
                ...agentResult,
                projectId: updated.projectId,
                scriptId: updated.id,
                projectTitle: updated.name,
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "剧本摘要生成失败，请稍后重试";

            await scriptService.markSummaryFailed(userId, projectId, message);
            throw error;
        }
    }
}

// scriptSummaryService 剧本摘要服务单例
export const scriptSummaryService = new ScriptSummaryService();
