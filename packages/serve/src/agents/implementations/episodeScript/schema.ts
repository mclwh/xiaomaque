import { z } from "zod";

/**
 * 分集剧本 Agent 结构化输出 Schema
 */

// episodeOutlineItemSchema 单集大纲
export const episodeOutlineItemSchema = z.object({
    episodeNumber: z.number().int().positive().describe("集数序号，从 1 开始"),
    title: z
        .string()
        .min(2)
        .max(40)
        .describe("本集名称，4-12 字，概括本集核心冲突或事件，如：金箍碎佛规"),
});

// episodeOutlineSchema 全部分集大纲
export const episodeOutlineSchema = z.object({
    episodes: z
        .array(episodeOutlineItemSchema)
        .min(1)
        .describe("全部分集的大纲列表，集数与名称一一对应"),
});

// episodeBatchContentItemSchema 批次内单集正文
export const episodeBatchContentItemSchema = z.object({
    episodeNumber: z.number().int().positive().describe("集数序号"),
    content: z
        .string()
        .min(100)
        .describe(
            "本集完整剧本正文，含 ### 场X-Y、时间内外景、出场人物、△动作、角色台词与【空镜】，不含集数标题行",
        ),
});

// episodeBatchContentSchema 单次调用生成的多集正文（最多 12 集）
export const episodeBatchContentSchema = z.object({
    episodes: z
        .array(episodeBatchContentItemSchema)
        .min(1)
        .max(12)
        .describe("本批次各集剧本正文，数量须与用户指定批次集数一致"),
});
