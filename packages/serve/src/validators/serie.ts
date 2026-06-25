import { z } from "zod";
import { IMAGE_STYLE_IDS } from "../lib/imageStyles.js";

// videoStyleIdSchema 视频风格 ID 校验
const videoStyleIdSchema = z.enum(IMAGE_STYLE_IDS).optional();

// listSeriesSchema 查询项目集数列表
export const listSeriesSchema = z.object({
    project_id: z.coerce.number().int().positive("项目 ID 无效"),
});

// getSerieDetailSchema 查询单个分集详情
export const getSerieDetailSchema = z.object({
    project_id: z.coerce.number().int().positive("项目 ID 无效"),
    serie_id: z.coerce.number().int().positive("分集 ID 无效"),
});

// createSerieSchema 新建项目分集
export const createSerieSchema = z.object({
    project_id: z.coerce.number().int().positive("项目 ID 无效"),
    name: z.string().trim().min(1, "分集名称不能为空").max(100, "分集名称过长"),
    params: z.record(z.string(), z.unknown()).optional(),
});

// batchDeleteSeriesSchema 批量删除项目分集
export const batchDeleteSeriesSchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
    serie_ids: z
        .array(z.number().int().positive("分集 ID 无效"))
        .min(1, "至少选择一个分集"),
});

// updateSerieNameSchema 重命名项目分集
export const updateSerieNameSchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
    serie_id: z.number().int().positive("分集 ID 无效"),
    subtitle: z.string().trim().min(1, "分集名称不能为空").max(100, "分集名称过长"),
});

// updateSerieFragmentsSchema 保存分集分镜列表
export const updateSerieFragmentsSchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
    serie_id: z.number().int().positive("分集 ID 无效"),
    fragments: z.array(z.record(z.string(), z.unknown())).min(1, "至少保留一个分镜"),
});

// updateSerieVideoGenerationSchema 保存分集视频生成参数
export const updateSerieVideoGenerationSchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
    serie_id: z.number().int().positive("分集 ID 无效"),
    model_id: z.string().trim().min(1, "模型不能为空"),
    aspect_ratio: z.string().trim().min(1, "比例不能为空"),
    resolution: z.string().trim().min(1, "分辨率不能为空"),
    video_style_id: videoStyleIdSchema,
});

// generateSerieSchema 分镜生成请求体
export const generateSerieSchema = z.object({
    project_id: z.coerce.number().int().positive("项目 ID 无效"),
    serie_id: z.coerce.number().int().positive("分集 ID 无效"),
    fragment_id: z.coerce.number().int().positive("分镜 ID 无效"),
    content: z.string().optional(),
    model_id: z.string().trim().min(1, "模型不能为空").optional(),
    aspect_ratio: z.string().trim().min(1, "比例不能为空").optional(),
    resolution: z.string().trim().min(1, "分辨率不能为空").optional(),
    video_style_id: videoStyleIdSchema,
});

// pollSerieGenerateSchema 分镜生成任务轮询请求体
export const pollSerieGenerateSchema = z.object({
    project_id: z.coerce.number().int().positive("项目 ID 无效"),
    serie_id: z.coerce.number().int().positive("分集 ID 无效"),
    fragment_id: z.coerce.number().int().positive("分镜 ID 无效"),
    task_id: z.string().trim().min(1, "任务 ID 无效"),
});

/*
 * 以下为各 schema 推导出的请求参数类型，供控制器复用（单一来源，避免手写重复类型）
 */
export type ListSeriesInput = z.infer<typeof listSeriesSchema>;
export type GetSerieDetailInput = z.infer<typeof getSerieDetailSchema>;
export type CreateSerieInput = z.infer<typeof createSerieSchema>;
export type BatchDeleteSeriesInput = z.infer<typeof batchDeleteSeriesSchema>;
export type UpdateSerieNameInput = z.infer<typeof updateSerieNameSchema>;
export type UpdateSerieFragmentsInput = z.infer<typeof updateSerieFragmentsSchema>;
export type UpdateSerieVideoGenerationInput = z.infer<typeof updateSerieVideoGenerationSchema>;
export type GenerateSerieInput = z.infer<typeof generateSerieSchema>;
export type PollSerieGenerateInput = z.infer<typeof pollSerieGenerateSchema>;
