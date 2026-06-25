import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import { assertProjectOwner } from "../lib/projectAccess.js";
import {
    createDefaultSerieFragment,
    listSerieFragmentRows,
    replaceSerieFragments,
    serializeFragmentStubsForApi,
    serializeFragmentsForApi,
} from "./serieFragment.js";

// SerieRow 分集主表常用字段
type SerieRow = {
    id: number;
    name: string;
    params: unknown;
    project_id: number;
    created_at: Date;
    updated_at: Date;
};

function formatSerie(serie: SerieRow, fragments: unknown) {
    return {
        id: serie.id,
        name: serie.name,
        fragments,
        params: serie.params,
        projectId: serie.project_id,
        createdAt: serie.created_at,
        updatedAt: serie.updated_at,
    };
}

// 合并分集 params 对象，保留已有字段（params 非对象时视为空对象）
function mergeSerieParams(serie: SerieRow, patch: Record<string, unknown>) {
    const currentParams =
        serie.params && typeof serie.params === "object" && !Array.isArray(serie.params)
            ? (serie.params as Record<string, unknown>)
            : {};

    return { ...currentParams, ...patch } as Prisma.InputJsonValue;
}

export class SerieService {
    // 校验分集存在且所属项目归属当前用户，返回分集行
    private async assertSerieOwner(userId: number, projectId: number, serieId: number) {
        await assertProjectOwner(userId, projectId);

        const serie = await prisma.serie.findFirst({
            where: {
                id: serieId,
                project_id: projectId,
            },
        });

        if (!serie) {
            throw new NotFoundError("分集不存在");
        }

        return serie;
    }

    // 查询项目下的集数列表
    async listByProject(userId: number, projectId: number) {
        await assertProjectOwner(userId, projectId);

        const series = await prisma.serie.findMany({
            where: { project_id: projectId },
            orderBy: { id: "asc" },
            include: {
                serie_fragments: {
                    orderBy: { sort_order: "asc" },
                    select: { id: true, sort_order: true },
                },
            },
        });

        return series.map((serie) =>
            formatSerie(
                serie,
                serializeFragmentStubsForApi(
                    serie.serie_fragments.map((fragment) => ({
                        id: fragment.id,
                        sort_order: fragment.sort_order,
                        content: "",
                        cover: "",
                        video: "",
                        duration_sec: null,
                        params: null,
                        asset_references: [],
                    })),
                ),
            ),
        );
    }

    // 查询单个分集详情
    async getSerieDetail(userId: number, projectId: number, serieId: number) {
        const serie = await this.assertSerieOwner(userId, projectId, serieId);
        const fragments = await listSerieFragmentRows(serieId);

        return formatSerie(serie, serializeFragmentsForApi(fragments));
    }

    // 新建项目分集
    async createSerie(
        userId: number,
        projectId: number,
        name: string,
        params?: Record<string, unknown>,
    ) {
        await assertProjectOwner(userId, projectId);

        const serie = await prisma.serie.create({
            data: {
                project_id: projectId,
                name,
                params: params ? (params as Prisma.InputJsonValue) : undefined,
            },
        });

        await createDefaultSerieFragment(serie.id);

        const fragments = await listSerieFragmentRows(serie.id);

        return formatSerie(serie, serializeFragmentsForApi(fragments));
    }

    // 批量删除项目分集（单条删除同样走此接口）
    async deleteSeries(userId: number, projectId: number, serieIds: number[]) {
        await assertProjectOwner(userId, projectId);

        if (serieIds.length === 0) {
            return [];
        }

        // uniqueSerieIds 去重后的待删除 ID 列表
        const uniqueSerieIds = [...new Set(serieIds)];
        const series = await prisma.serie.findMany({
            where: {
                id: { in: uniqueSerieIds },
                project_id: projectId,
            },
            select: { id: true },
        });

        if (series.length !== uniqueSerieIds.length) {
            throw new NotFoundError("分集不存在");
        }

        await prisma.$transaction(async (tx) => {
            await tx.script.updateMany({
                where: { serie_id: { in: uniqueSerieIds } },
                data: { serie_id: null },
            });

            await tx.serie.deleteMany({
                where: {
                    id: { in: uniqueSerieIds },
                    project_id: projectId,
                },
            });
        });

        return uniqueSerieIds.map((id) => ({ id }));
    }

    // 重命名项目分集（更新 params.subtitle）
    async updateSerieSubtitle(
        userId: number,
        projectId: number,
        serieId: number,
        subtitle: string,
    ) {
        const serie = await this.assertSerieOwner(userId, projectId, serieId);

        const updated = await prisma.serie.update({
            where: { id: serieId },
            data: {
                params: mergeSerieParams(serie, { subtitle: subtitle.trim() }),
            },
        });

        const fragments = await listSerieFragmentRows(serieId);

        return formatSerie(updated, serializeFragmentsForApi(fragments));
    }

    // 保存项目分集视频生成参数（模型、比例、分辨率）
    async updateSerieVideoGeneration(
        userId: number,
        projectId: number,
        serieId: number,
        videoGeneration: {
            modelId: string;
            aspectRatio: string;
            resolution: string;
            videoStyleId?: string;
        },
    ) {
        const serie = await this.assertSerieOwner(userId, projectId, serieId);

        const updated = await prisma.serie.update({
            where: { id: serieId },
            data: {
                params: mergeSerieParams(serie, { videoGeneration }),
            },
        });

        const fragments = await listSerieFragmentRows(serieId);

        return formatSerie(updated, serializeFragmentsForApi(fragments));
    }

    // 保存项目分集 fragments
    async updateSerieFragments(
        userId: number,
        projectId: number,
        serieId: number,
        fragments: unknown[],
    ) {
        await this.assertSerieOwner(userId, projectId, serieId);

        const fragmentRows = await replaceSerieFragments(projectId, serieId, fragments);
        const updated = await prisma.serie.update({
            where: { id: serieId },
            data: {
                updated_at: new Date(),
            },
        });

        return formatSerie(updated, serializeFragmentsForApi(fragmentRows));
    }
}

// serieService 分集服务单例
export const serieService = new SerieService();
