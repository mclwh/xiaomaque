import { z } from "zod";

/**
 * 剧本摘要 Agent 结构化输出 Schema
 */

// scriptSummaryCharacterSchema 人物小传字段
export const scriptSummaryCharacterSchema = z.object({
    name: z.string().describe("角色名，如：孙悟空"),
    title: z.string().describe("称号或身份名，如：斗战胜佛"),
    roleType: z.string().describe("角色类型：主角 / 配角 / 反派"),
    visualImage: z.string().describe("视觉形象，含性别、外貌、服饰、气质"),
    coreTags: z.string().describe("核心标签，用顿号或逗号分隔"),
    identityBackground: z.string().describe("身份背景与核心动机"),
    growthExperience: z.string().describe("成长经历与关键转折"),
    personality: z.string().describe("性格特点"),
    relationships: z.string().describe("与其他主要角色的关系"),
    growthArc: z.string().describe("成长弧线，用 -> 连接三个阶段"),
});

// scriptSummarySchema 完整剧本摘要
export const scriptSummarySchema = z.object({
    episodeCount: z.number().int().positive().describe("建议自定义集数"),
    storyType: z.string().describe("故事类型，多个标签用 + 连接"),
    targetAudience: z.string().describe("目标受众，如：男频 / 大众"),
    coreHook: z.string().describe("核心梗，多个卖点用 + 连接"),
    oneLineStory: z.string().describe("一句话故事，高度概括主线与反转"),
    characters: z
        .array(scriptSummaryCharacterSchema)
        .min(2)
        .describe("主要人物小传，覆盖主角与关键配角"),
    synopsis: z.string().describe("故事梗概，一段完整叙事，涵盖起承转合与结局"),
});
