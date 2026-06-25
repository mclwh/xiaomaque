import { request } from "@/api/http";

// SerieEpisodeStats 分集统计
export type SerieEpisodeStats = {
    characterCount?: number;
    sceneCount?: number;
    storyboardCount?: number;
};

// SerieParams 分集扩展参数
export type SerieParams = {
    status?: "pending" | "generating" | "generated";
    subtitle?: string;
    stats?: SerieEpisodeStats;
    videoGeneration?: {
        modelId: string;
        aspectRatio: string;
        resolution: string;
        videoStyleId?: string;
    };
};

// ProjectSerie 项目集数
export type ProjectSerie = {
    id: number;
    name: string;
    fragments: unknown;
    params: SerieParams | null;
    projectId: number;
    createdAt: string;
    updatedAt: string;
};

// CreateProjectSerieInput 新建分集请求体
export type CreateProjectSerieInput = {
    projectId: number;
    name: string;
    params?: SerieParams;
};

// BatchDeleteProjectSeriesPayload 批量删除分集请求体
export type BatchDeleteProjectSeriesPayload = {
    project_id: number;
    serie_ids: number[];
};

// UpdateProjectSerieNamePayload 重命名分集请求体
export type UpdateProjectSerieNamePayload = {
    project_id: number;
    serie_id: number;
    subtitle: string;
};

// 查询项目下的集数列表
export function fetchProjectSeries(projectId: number, signal?: AbortSignal) {
    return request<ProjectSerie[]>("/serie/list", {
        method: "GET",
        params: { project_id: projectId },
        signal,
    });
}

// 查询单个分集详情
export function fetchSerieDetail(projectId: number, serieId: number, signal?: AbortSignal) {
    return request<ProjectSerie>("/serie/detail", {
        method: "GET",
        params: {
            project_id: projectId,
            serie_id: serieId,
        },
        signal,
    });
}

// 新建项目分集
export function createProjectSerie(input: CreateProjectSerieInput, signal?: AbortSignal) {
    return request<ProjectSerie>("/serie/create", {
        method: "POST",
        data: {
            project_id: input.projectId,
            name: input.name,
            params: input.params,
        },
        signal,
    });
}

// 批量删除项目分集
export function batchDeleteProjectSeries(payload: BatchDeleteProjectSeriesPayload) {
    return request<Array<{ id: number }>>("/serie/batch_delete", {
        method: "POST",
        data: payload,
    });
}

// UpdateProjectSerieFragmentsPayload 保存分集 fragments 请求体
export type UpdateProjectSerieFragmentsPayload = {
    project_id: number;
    serie_id: number;
    fragments: unknown[];
};

// 重命名项目分集
export function updateProjectSerieName(payload: UpdateProjectSerieNamePayload) {
    return request<ProjectSerie>("/serie/update_name", {
        method: "POST",
        data: payload,
    });
}

// UpdateProjectSerieVideoGenerationPayload 保存分集视频生成参数请求体
export type UpdateProjectSerieVideoGenerationPayload = {
    project_id: number;
    serie_id: number;
    model_id: string;
    aspect_ratio: string;
    resolution: string;
    video_style_id?: string;
};

// 保存项目分集视频生成参数（模型、比例、分辨率）
export function updateProjectSerieVideoGeneration(payload: UpdateProjectSerieVideoGenerationPayload) {
    return request<ProjectSerie>("/serie/update_video_generation", {
        method: "POST",
        data: payload,
    });
}

// 保存项目分集 fragments
export function updateProjectSerieFragments(payload: UpdateProjectSerieFragmentsPayload) {
    return request<ProjectSerie>("/serie/save_fragments", {
        method: "POST",
        data: payload,
    });
}

// GenerateSerieFragmentPayload 分镜生成请求体
export type GenerateSerieFragmentPayload = {
    project_id: number;
    serie_id: number;
    fragment_id: number;
    content?: string;
    model_id?: string;
    aspect_ratio?: string;
    resolution?: string;
    video_style_id?: string;
};

// GenerateSerieFragmentResult 分镜生成任务提交结果
export type GenerateSerieFragmentResult = {
    taskId: string;
    fragmentId: number;
    projectId: number;
    serieId: number;
};

// PollSerieFragmentGenerationPayload 分镜生成轮询请求体
export type PollSerieFragmentGenerationPayload = {
    project_id: number;
    serie_id: number;
    fragment_id: number;
    task_id: string;
};

// PollSerieFragmentGenerationResult 分镜生成轮询结果
export type PollSerieFragmentGenerationResult = {
    status: "queued" | "running" | "succeeded" | "failed";
    progress?: number;
    message?: string;
    fragment?: {
        id: number;
        content: string;
        reference: unknown[];
        cover: string;
        video: string;
        durationSec?: number;
    };
    serie?: ProjectSerie;
};

// 提交分镜视频生成任务
export function generateSerieFragment(payload: GenerateSerieFragmentPayload) {
    return request<GenerateSerieFragmentResult>("/serie/generate", {
        method: "POST",
        data: payload,
    });
}

// 轮询分镜视频生成任务进度
export function pollSerieFragmentGeneration(payload: PollSerieFragmentGenerationPayload) {
    return request<PollSerieFragmentGenerationResult>("/serie/generate_status", {
        method: "POST",
        data: payload,
    });
}
