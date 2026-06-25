import { z } from "zod";

// listRecentProjectsSchema 最近项目列表 query 校验
export const listRecentProjectsSchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

// getProjectDetailSchema 项目详情 query 校验
export const getProjectDetailSchema = z.object({
    project_id: z.coerce.number().int().positive("项目 ID 无效"),
});

// updateProjectTitleSchema 重命名项目
export const updateProjectTitleSchema = z.object({
    project_id: z.number().int().positive("项目 ID 无效"),
    title: z.string().trim().min(1, "项目名称不能为空").max(100, "项目名称过长"),
});

// batchDeleteProjectsSchema 批量删除项目
export const batchDeleteProjectsSchema = z.object({
    project_ids: z
        .array(z.number().int().positive("项目 ID 无效"))
        .min(1, "至少选择一个项目"),
});

/*
 * 各 schema 推导出的请求参数类型，供控制器复用
 */
export type ListRecentProjectsInput = z.infer<typeof listRecentProjectsSchema>;
export type GetProjectDetailInput = z.infer<typeof getProjectDetailSchema>;
export type UpdateProjectTitleInput = z.infer<typeof updateProjectTitleSchema>;
export type BatchDeleteProjectsInput = z.infer<typeof batchDeleteProjectsSchema>;
