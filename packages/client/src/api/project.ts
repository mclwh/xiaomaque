import { request } from "@/api/http";
import type { RequestOptions } from "@/api/types";
import type { ProjectAssetTabCounts } from "@/lib/projectAssetTabs";

// Project 短剧项目
export type Project = {
    id: number;
    title: string;
    description: string | null;
    content: unknown;
    params: unknown;
    createdAt: string;
    updatedAt: string;
};

// RecentProject 最近项目列表项
export type RecentProject = Project & {
    episodeCount: number;
};

// ProjectDetail 项目详情
export type ProjectDetail = Project & {
    hasScript: boolean;
    assetTabCounts: ProjectAssetTabCounts;
};

// 静默新建短剧项目（无需传参）
export function createProject() {
    return request<Project>("/project/create", {
        method: "POST",
    });
}

// 获取项目详情
export function fetchProjectDetail(projectId: number, options?: RequestOptions) {
    return request<ProjectDetail>("/project/detail", {
        method: "GET",
        params: { project_id: projectId },
        signal: options?.signal,
    });
}

// 获取当前用户最近更新的项目列表
export function fetchRecentProjects(limit = 12, options?: RequestOptions) {
    return request<RecentProject[]>("/project/list", {
        method: "GET",
        params: { limit },
        signal: options?.signal,
    });
}

// 重命名项目
export function updateProjectTitle(projectId: number, title: string) {
    return request<Project>("/project/update_title", {
        method: "POST",
        data: { project_id: projectId, title },
    });
}

// 批量删除项目（单条删除同样走此接口）
export function batchDeleteProjects(projectIds: number[]) {
    return request<Project[]>("/project/batch_delete", {
        method: "POST",
        data: { project_ids: projectIds },
    });
}
