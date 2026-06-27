import type { ScriptSummary, ScriptSummaryCharacter } from "./types.js";

/**
 * 将结构化剧本摘要格式化为产品展示用纯文本
 */

// 格式化单个人物小传块
function formatCharacterBlock(character: ScriptSummaryCharacter): string {
    return [
        `${character.name}，${character.title}`,
        `角色类型：${character.roleType}`,
        `视觉形象：${character.visualImage}`,
        `核心标签：${character.coreTags}`,
        `身份背景：${character.identityBackground}`,
        `成长经历：${character.growthExperience}`,
        `性格特点：${character.personality}`,
        `角色关系：${character.relationships}`,
        `成长弧线：${character.growthArc}`,
    ].join("\n");
}

/**
 * 将剧本摘要对象转为与产品模板一致的展示文本
 * @param summary 结构化剧本摘要
 */
export function formatScriptSummaryText(summary: ScriptSummary): string {
    const characterBlocks = summary.characters.map(formatCharacterBlock).join("\n\n");

    return [
        "自定义集数",
        String(summary.episodeCount),
        "故事类型",
        summary.storyType,
        "目标受众",
        summary.targetAudience,
        "核心梗",
        summary.coreHook,
        "一句话故事",
        summary.oneLineStory,
        "人物小传",
        characterBlocks,
        "故事梗概",
        summary.synopsis,
    ].join("\n");
}
