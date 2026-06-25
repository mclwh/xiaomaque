import { prisma } from "../config/prisma.js";
import { ASSET_LIST_FILTER_TYPES } from "../lib/assetCategory.js";
import { BadRequestError, NotFoundError } from "../lib/errors.js";

// DEFAULT_PROJECT_TITLE 新建项目时的固定默认标题
const DEFAULT_PROJECT_TITLE = "未命名项目";

// DEFAULT_RECENT_LIMIT 最近项目列表默认条数
const DEFAULT_RECENT_LIMIT = 12;

// 格式化返回给前端的项目信息
function formatProject(project: {
    id: number;
    title: string;
    description: string | null;
    content: unknown;
    params: unknown;
    created_at: Date;
    updated_at: Date;
}) {
    return {
        id: project.id,
        title: project.title,
        description: project.description,
        content: project.content,
        params: project.params,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
    };
}

// 格式化最近项目列表项（含剧集数量）
function formatRecentProject(project: {
    id: number;
    title: string;
    description: string | null;
    content: unknown;
    params: unknown;
    created_at: Date;
    updated_at: Date;
    _count: {
        series: number;
    };
}) {
    return {
        ...formatProject(project),
        episodeCount: project._count.series,
    };
}

export class ProjectService {
    // 为当前用户静默新建项目（固定默认标题，无需前端传参）
    async createProject(userId: number) {
        const project = await prisma.project.create({
            data: {
                title: DEFAULT_PROJECT_TITLE,
                user_id: userId,
            },
        });

        return formatProject(project);
    }

    // 查询当前用户最近更新的项目列表
    async listRecentByUser(userId: number, limit = DEFAULT_RECENT_LIMIT) {
        const projects = await prisma.project.findMany({
            where: { user_id: userId },
            orderBy: { updated_at: "desc" },
            take: limit,
            include: {
                _count: {
                    select: { series: true },
                },
            },
        });

        return projects.map(formatRecentProject);
    }

    // 统计项目各资产 Tab 数量（不含 type=none 的画布节点）
    async countAssetTabsByProject(projectId: number) {
        const rows = await prisma.asset.groupBy({
            by: ["type"],
            where: {
                project_id: projectId,
                type: { in: [...ASSET_LIST_FILTER_TYPES] },
            },
            _count: { id: true },
        });

        /*
         * counts 各 Tab 默认数量
         * row 分组统计行
         */
        const counts = Object.fromEntries(
            ASSET_LIST_FILTER_TYPES.map((type) => [type, 0]),
        ) as Record<(typeof ASSET_LIST_FILTER_TYPES)[number], number>;

        for (const row of rows) {
            if (row.type in counts) {
                counts[row.type as keyof typeof counts] = row._count.id;
            }
        }

        return counts;
    }

    // 查询项目详情，并返回是否存在剧情（script）记录及各资产 Tab 数量
    async getProjectDetail(userId: number, projectId: number) {
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user_id: userId,
            },
            include: {
                script: {
                    select: { id: true },
                },
            },
        });

        if (!project) {
            throw new NotFoundError("项目不存在");
        }

        const assetTabCounts = await this.countAssetTabsByProject(projectId);

        return {
            ...formatProject(project),
            hasScript: project.script !== null,
            assetTabCounts,
        };
    }

    // 重命名项目
    async updateProjectTitle(userId: number, projectId: number, title: string) {
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                user_id: userId,
            },
        });

        if (!project) {
            throw new NotFoundError("项目不存在");
        }

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: { title },
        });

        return formatProject(updated);
    }

    // 批量删除项目（单条删除同样走此接口）
    async deleteProjects(userId: number, projectIds: number[]) {
        const uniqueProjectIds = [...new Set(projectIds)];

        if (uniqueProjectIds.length === 0) {
            throw new BadRequestError("至少选择一个项目");
        }

        const projects = await prisma.project.findMany({
            where: {
                id: { in: uniqueProjectIds },
                user_id: userId,
            },
        });

        if (projects.length !== uniqueProjectIds.length) {
            throw new NotFoundError("项目不存在");
        }

        await prisma.project.deleteMany({
            where: {
                id: { in: uniqueProjectIds },
                user_id: userId,
            },
        });

        return projects.map(formatProject);
    }
}

// projectService 项目服务单例（无状态，跨控制器复用）
export const projectService = new ProjectService();
