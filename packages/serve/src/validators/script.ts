import { z } from "zod";
import { IMAGE_STYLE_IDS } from "../lib/imageStyles.js";

// SUMMARY_STATUS 剧本摘要生成状态
export const SUMMARY_STATUS = {
    PENDING: "pending",
    GENERATING: "generating",
    COMPLETED: "completed",
    FAILED: "failed",
} as const;

// SummaryStatus 剧本摘要状态类型
export type SummaryStatus = (typeof SUMMARY_STATUS)[keyof typeof SUMMARY_STATUS];

// createScriptDraftSchema 创建剧本草稿请求校验
export const createScriptDraftSchema = z.object({
    creative: z
        .string()
        .min(20, "原始创意至少 20 字")
        .max(30000, "原始创意不能超过 30000 字"),
    episodeCount: z
        .number()
        .int("集数须为整数")
        .min(1, "集数至少为 1")
        .max(999, "集数不能超过 999")
        .optional(),
    imageStyleId: z.enum(IMAGE_STYLE_IDS).optional(),
});

// getScriptDetailSchema 剧本详情 query 校验
export const getScriptDetailSchema = z.object({
    project_id: z.coerce.number().int().positive("项目 ID 无效"),
});

// generateScriptSummarySchema 生成剧本摘要请求校验
export const generateScriptSummarySchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
});

// generateEpisodeScriptSchema 生成分集剧本请求校验
export const generateEpisodeScriptSchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
});

// CreateScriptDraftInput 创建剧本草稿参数类型
export type CreateScriptDraftInput = z.infer<typeof createScriptDraftSchema>;

// GetScriptDetailInput 剧本详情 query 类型
export type GetScriptDetailInput = z.infer<typeof getScriptDetailSchema>;

// GenerateScriptSummaryInput 生成剧本摘要参数类型
export type GenerateScriptSummaryInput = z.infer<typeof generateScriptSummarySchema>;

// GenerateEpisodeScriptInput 生成分集剧本参数类型
export type GenerateEpisodeScriptInput = z.infer<typeof generateEpisodeScriptSchema>;
