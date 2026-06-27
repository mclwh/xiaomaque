import {
    getImageStyleLabel,
    IMAGE_STYLE_IDS,
    resolveImageStylePrompt,
    type ImageStyleId,
} from "../../../lib/imageStyles.js";
import type { ScriptSummaryAgentInput } from "./types.js";

/**
 * 构建剧本摘要 Agent 的用户消息，合并创意与制作参数
 */

// 解析合法的画面风格 ID
function resolveImageStyleId(styleId?: string): ImageStyleId | undefined {
    if (!styleId) {
        return undefined;
    }

    return IMAGE_STYLE_IDS.includes(styleId as ImageStyleId)
        ? (styleId as ImageStyleId)
        : undefined;
}

/**
 * 将入参格式化为 LLM 用户消息
 * @param input 原始创意与制作参数
 */
export function buildScriptSummaryUserMessage(input: ScriptSummaryAgentInput): string {
    const creative = input.creative.trim();
    const sections = [`原始创意：\n${creative}`];
    const productionParams: string[] = [];

    if (input.episodeCount !== undefined) {
        productionParams.push(
            `- 目标集数：${input.episodeCount} 集（输出中的 episodeCount 必须与该值完全一致，不得自行修改）`,
        );
    }

    const imageStyleId = resolveImageStyleId(input.imageStyleId);

    if (imageStyleId) {
        const label = getImageStyleLabel(imageStyleId);
        const stylePrompt = resolveImageStylePrompt(imageStyleId);

        productionParams.push(
            `- 画面风格：${label}（${imageStyleId}）`,
            `  风格说明：${stylePrompt}`,
            "  人物 visualImage、故事类型标签与整体美学须符合该画面风格",
        );
    }

    if (productionParams.length > 0) {
        sections.push(["制作参数：", ...productionParams].join("\n"));
    }

    return sections.join("\n\n");
}
