import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { ScriptSummary } from "../agents/implementations/scriptSummary/types.js";
import type { SerieEpisodeItem } from "../agents/implementations/episodeScript/types.js";
import { NotFoundError } from "../lib/errors.js";
import { SUMMARY_STATUS, type SummaryStatus } from "../validators/script.js";

/**
 * 剧本服务：项目与剧本记录的创建、查询与更新
 */

// DEFAULT_PROJECT_TITLE 新建项目默认标题
const DEFAULT_PROJECT_TITLE = "未命名项目";

// DEFAULT_SCRIPT_NAME 新建剧本默认名称
const DEFAULT_SCRIPT_NAME = "未命名剧本";

// PROJECT_TITLE_MAX_LENGTH 项目标题最大长度
const PROJECT_TITLE_MAX_LENGTH = 40;

// ScriptParams 剧本 params 字段结构
export type ScriptParams = {
    episodeCount?: number;
    imageStyleId?: string;
    text?: string;
    summaryStatus?: SummaryStatus;
    summaryError?: string;
    serieContentStatus?: SummaryStatus;
    serieContentError?: string;
};

// CreateScriptDraftInput 创建剧本草稿入参
export type CreateScriptDraftInput = {
    userId: number;
    creative: string;
    episodeCount?: number;
    imageStyleId?: string;
};

// ScriptDraftRecord 剧本草稿创建结果
export type ScriptDraftRecord = {
    projectId: number;
    scriptId: number;
    projectTitle: string;
};

// ScriptDetailRecord 剧本详情
export type ScriptDetailRecord = {
    id: number;
    projectId: number;
    name: string;
    source: string | null;
    summary: ScriptSummary | null;
    serieContent: SerieEpisodeItem[] | null;
    params: ScriptParams;
    summaryStatus: SummaryStatus;
    summaryText: string | null;
    serieContentStatus: SummaryStatus;
    episodeCount: number | null;
    createdAt: Date;
    updatedAt: Date;
};

// ApplyScriptSummaryInput 写入剧本摘要入参
export type ApplyScriptSummaryInput = {
    userId: number;
    projectId: number;
    summary: ScriptSummary;
    summaryText: string;
};

// 截断文本用于项目标题或剧本名称
function truncateText(text: string, maxLength: number): string {
    const trimmed = text.trim();

    if (!trimmed) {
        return "";
    }

    if (trimmed.length <= maxLength) {
        return trimmed;
    }

    return `${trimmed.slice(0, maxLength)}…`;
}

// 从剧本摘要推导项目与剧本展示名称
function resolveScriptDisplayName(summary: ScriptSummary): string {
    return (
        truncateText(summary.oneLineStory, PROJECT_TITLE_MAX_LENGTH) ||
        truncateText(summary.synopsis, PROJECT_TITLE_MAX_LENGTH) ||
        DEFAULT_SCRIPT_NAME
    );
}

// 解析剧本 params JSON
function parseScriptParams(raw: unknown): ScriptParams {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return {};
    }

    return raw as ScriptParams;
}

// 解析剧本 summary JSON
function parseScriptSummary(raw: unknown): ScriptSummary | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return null;
    }

    return raw as ScriptSummary;
}

// 解析分集剧本 serie_content JSON
function parseSerieContent(raw: unknown): SerieEpisodeItem[] | null {
    if (!Array.isArray(raw) || raw.length === 0) {
        return null;
    }

    return raw as SerieEpisodeItem[];
}

// 推断分集剧本整体状态
function resolveSerieContentStatus(
    params: ScriptParams,
    serieContent: SerieEpisodeItem[] | null,
): SummaryStatus {
    if (params.serieContentStatus) {
        return params.serieContentStatus;
    }

    if (!serieContent || serieContent.length === 0) {
        return SUMMARY_STATUS.PENDING;
    }

    const allCompleted = serieContent.every((item) => item.status === "completed");

    if (allCompleted) {
        return SUMMARY_STATUS.COMPLETED;
    }

    const anyGenerating = serieContent.some((item) => item.status === "generating");

    if (anyGenerating) {
        return SUMMARY_STATUS.GENERATING;
    }

    return SUMMARY_STATUS.PENDING;
}

// 格式化剧本详情
function formatScriptDetail(script: {
    id: number;
    name: string;
    source: string | null;
    summary: unknown;
    serie_content: unknown;
    params: unknown;
    project_id: number;
    created_at: Date;
    updated_at: Date;
}): ScriptDetailRecord {
    const params = parseScriptParams(script.params);
    const summary = parseScriptSummary(script.summary);
    const serieContent = parseSerieContent(script.serie_content);
    const summaryStatus =
        params.summaryStatus ??
        (summary ? SUMMARY_STATUS.COMPLETED : SUMMARY_STATUS.PENDING);

    return {
        id: script.id,
        projectId: script.project_id,
        name: script.name,
        source: script.source,
        summary,
        serieContent,
        params,
        summaryStatus,
        summaryText: params.text ?? null,
        serieContentStatus: resolveSerieContentStatus(params, serieContent),
        episodeCount: params.episodeCount ?? summary?.episodeCount ?? null,
        createdAt: script.created_at,
        updatedAt: script.updated_at,
    };
}

/**
 * 剧本数据库操作
 */
export class ScriptService {
    // 查询当前用户项目下的剧本详情
    async getByProjectId(userId: number, projectId: number): Promise<ScriptDetailRecord> {
        const script = await prisma.script.findFirst({
            where: {
                project_id: projectId,
                project: { user_id: userId },
            },
        });

        if (!script) {
            throw new NotFoundError("剧本不存在");
        }

        return formatScriptDetail(script);
    }

    // 新建项目与剧本草稿，原始创意写入 source
    async createDraft(input: CreateScriptDraftInput): Promise<ScriptDraftRecord> {
        const scriptParams: Prisma.InputJsonObject = {
            summaryStatus: SUMMARY_STATUS.PENDING,
            ...(input.episodeCount !== undefined ? { episodeCount: input.episodeCount } : {}),
            ...(input.imageStyleId ? { imageStyleId: input.imageStyleId } : {}),
        };

        const record = await prisma.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    title: DEFAULT_PROJECT_TITLE,
                    user_id: input.userId,
                },
            });

            const script = await tx.script.create({
                data: {
                    name: DEFAULT_SCRIPT_NAME,
                    source: input.creative,
                    params: scriptParams,
                    project_id: project.id,
                },
            });

            return {
                projectId: project.id,
                scriptId: script.id,
                projectTitle: project.title,
            };
        });

        return record;
    }

    // 标记剧本摘要进入生成中
    async markSummaryGenerating(userId: number, projectId: number): Promise<ScriptDetailRecord> {
        const script = await prisma.script.findFirst({
            where: {
                project_id: projectId,
                project: { user_id: userId },
            },
        });

        if (!script) {
            throw new NotFoundError("剧本不存在");
        }

        const params = parseScriptParams(script.params);

        const updated = await prisma.script.update({
            where: { id: script.id },
            data: {
                params: {
                    ...params,
                    summaryStatus: SUMMARY_STATUS.GENERATING,
                    summaryError: undefined,
                } as Prisma.InputJsonValue,
            },
        });

        return formatScriptDetail(updated);
    }

    // 标记剧本摘要生成失败
    async markSummaryFailed(
        userId: number,
        projectId: number,
        errorMessage: string,
    ): Promise<void> {
        const script = await prisma.script.findFirst({
            where: {
                project_id: projectId,
                project: { user_id: userId },
            },
        });

        if (!script) {
            throw new NotFoundError("剧本不存在");
        }

        const params = parseScriptParams(script.params);

        await prisma.script.update({
            where: { id: script.id },
            data: {
                params: {
                    ...params,
                    summaryStatus: SUMMARY_STATUS.FAILED,
                    summaryError: errorMessage,
                } as Prisma.InputJsonValue,
            },
        });
    }

    // 写入剧本摘要并同步更新项目标题
    async applySummary(input: ApplyScriptSummaryInput): Promise<ScriptDetailRecord> {
        const script = await prisma.script.findFirst({
            where: {
                project_id: input.projectId,
                project: { user_id: input.userId },
            },
        });

        if (!script) {
            throw new NotFoundError("剧本不存在");
        }

        const params = parseScriptParams(script.params);
        const displayName = resolveScriptDisplayName(input.summary);

        const updatedParams: Prisma.InputJsonObject = {
            ...params,
            episodeCount: params.episodeCount ?? input.summary.episodeCount,
            text: input.summaryText,
            summaryStatus: SUMMARY_STATUS.COMPLETED,
            summaryError: undefined,
        };

        const updated = await prisma.$transaction(async (tx) => {
            await tx.project.update({
                where: { id: input.projectId },
                data: { title: displayName || DEFAULT_PROJECT_TITLE },
            });

            return tx.script.update({
                where: { id: script.id },
                data: {
                    name: displayName || DEFAULT_SCRIPT_NAME,
                    summary: input.summary as Prisma.InputJsonValue,
                    params: updatedParams,
                },
            });
        });

        return formatScriptDetail(updated);
    }

    // 标记分集剧本进入生成中
    async markSerieContentGenerating(userId: number, projectId: number): Promise<void> {
        const script = await this.getOwnedScript(userId, projectId);
        const params = parseScriptParams(script.params);

        await prisma.script.update({
            where: { id: script.id },
            data: {
                params: {
                    ...params,
                    serieContentStatus: SUMMARY_STATUS.GENERATING,
                    serieContentError: undefined,
                } as Prisma.InputJsonValue,
            },
        });
    }

    // 标记分集剧本生成失败
    async markSerieContentFailed(
        userId: number,
        projectId: number,
        errorMessage: string,
    ): Promise<void> {
        const script = await this.getOwnedScript(userId, projectId);
        const params = parseScriptParams(script.params);

        await prisma.script.update({
            where: { id: script.id },
            data: {
                params: {
                    ...params,
                    serieContentStatus: SUMMARY_STATUS.FAILED,
                    serieContentError: errorMessage,
                } as Prisma.InputJsonValue,
            },
        });
    }

    // 写入分集大纲占位（仅集数与名称，正文待生成）
    async applyEpisodeOutline(
        userId: number,
        projectId: number,
        episodes: Array<{ episodeNumber: number; title: string }>,
    ): Promise<void> {
        const script = await this.getOwnedScript(userId, projectId);
        const serieContent: SerieEpisodeItem[] = episodes.map((episode) => ({
            episodeNumber: episode.episodeNumber,
            title: episode.title,
            content: "",
            status: "pending",
        }));

        await prisma.script.update({
            where: { id: script.id },
            data: {
                serie_content: serieContent as Prisma.InputJsonValue,
            },
        });
    }

    // 更新单集剧本正文并写回 serie_content
    async updateEpisodeContent(
        userId: number,
        projectId: number,
        episodeNumber: number,
        content: string,
        status: SerieEpisodeItem["status"],
    ): Promise<void> {
        const script = await this.getOwnedScript(userId, projectId);
        const serieContent = parseSerieContent(script.serie_content);

        if (!serieContent) {
            throw new Error("分集剧本数据不存在");
        }

        const nextContent = serieContent.map((item) =>
            item.episodeNumber === episodeNumber
                ? { ...item, content, status }
                : item,
        );

        await prisma.script.update({
            where: { id: script.id },
            data: {
                serie_content: nextContent as Prisma.InputJsonValue,
            },
        });
    }

    // 标记单集进入生成中
    async markEpisodeGenerating(
        userId: number,
        projectId: number,
        episodeNumber: number,
    ): Promise<void> {
        const script = await this.getOwnedScript(userId, projectId);
        const serieContent = parseSerieContent(script.serie_content);

        if (!serieContent) {
            throw new Error("分集剧本数据不存在");
        }

        const nextContent = serieContent.map((item) =>
            item.episodeNumber === episodeNumber
                ? { ...item, status: "generating" as const }
                : item,
        );

        await prisma.script.update({
            where: { id: script.id },
            data: {
                serie_content: nextContent as Prisma.InputJsonValue,
            },
        });
    }

    // 标记分集剧本全部生成完成
    async markSerieContentCompleted(userId: number, projectId: number): Promise<void> {
        const script = await this.getOwnedScript(userId, projectId);
        const params = parseScriptParams(script.params);

        await prisma.script.update({
            where: { id: script.id },
            data: {
                params: {
                    ...params,
                    serieContentStatus: SUMMARY_STATUS.COMPLETED,
                    serieContentError: undefined,
                } as Prisma.InputJsonValue,
            },
        });
    }

    // 查询当前用户拥有的剧本原始记录
    private async getOwnedScript(userId: number, projectId: number) {
        const script = await prisma.script.findFirst({
            where: {
                project_id: projectId,
                project: { user_id: userId },
            },
        });

        if (!script) {
            throw new NotFoundError("剧本不存在");
        }

        return script;
    }
}

// scriptService 剧本服务单例
export const scriptService = new ScriptService();
