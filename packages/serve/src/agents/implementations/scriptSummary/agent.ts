import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createChatModel } from "../../llm.js";
import { buildScriptSummaryUserMessage } from "./buildUserMessage.js";
import { SCRIPT_SUMMARY_AGENT_ID, SCRIPT_SUMMARY_AGENT_NAME } from "./constants.js";
import { formatScriptSummaryText } from "./format.js";
import { SCRIPT_SUMMARY_SYSTEM_PROMPT } from "./prompt.js";
import { scriptSummarySchema } from "./schema.js";
import type { ScriptSummaryAgentInput, ScriptSummaryAgentOutput } from "./types.js";

/**
 * 剧本摘要 Agent：将原始创意与制作参数转换为结构化剧本摘要
 */

/**
 * 执行剧本摘要生成
 * @param input 原始创意、集数、画面风格等入参
 */
export async function runScriptSummaryAgent(
    input: ScriptSummaryAgentInput,
): Promise<ScriptSummaryAgentOutput> {
    const trimmed = input.creative.trim();

    if (!trimmed) {
        throw new Error("原始创意不能为空");
    }

    const model = createChatModel(1);
    const structuredModel = model.withStructuredOutput(scriptSummarySchema, {
        name: "script_summary",
    });

    const summary = await structuredModel.invoke([
        new SystemMessage(SCRIPT_SUMMARY_SYSTEM_PROMPT),
        new HumanMessage(buildScriptSummaryUserMessage({ ...input, creative: trimmed })),
    ]);

    if (input.episodeCount !== undefined) {
        summary.episodeCount = input.episodeCount;
    }

    return {
        agentId: SCRIPT_SUMMARY_AGENT_ID,
        agentName: SCRIPT_SUMMARY_AGENT_NAME,
        summary,
        text: formatScriptSummaryText(summary),
    };
}
