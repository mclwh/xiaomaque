import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { assertAssetOwner } from "../lib/assetAccess.js";
import {
    buildLibraryAssetWhere,
    type LibraryAssetFilter,
    type LibraryAssetSortOrder,
} from "../lib/assetLibraryQuery.js";
import {
    getCanvasKindDefaultName,
    resolveAssetCategoryFields,
} from "../lib/assetCategory.js";
import { generateDeriveId } from "../lib/deriveId.js";
import { BadRequestError, NotFoundError } from "../lib/errors.js";
import { assertProjectOwner } from "../lib/projectAccess.js";
import { formatAssetForApi } from "../lib/formatAsset.js";

// ASSET_SERIES_INCLUDE 查询资产时附带出现集数关联
const ASSET_SERIES_INCLUDE = {
    asset_series: {
        select: { serie_id: true },
    },
} as const;

// 读取 params.canvas 下指定字符串字段并去除首尾空白（空串返回 undefined）
function readCanvasStringField(params: unknown, field: string): string | undefined {
    if (!params || typeof params !== "object") {
        return undefined;
    }

    const canvas = (params as Record<string, unknown>).canvas;

    if (!canvas || typeof canvas !== "object") {
        return undefined;
    }

    const value = (canvas as Record<string, unknown>)[field];

    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
}

// 画布 save 时保留资料字段，避免覆盖 update_profile 写入的数据
function preserveProfileParamsOnSave(existingParams: unknown, incomingParams: unknown) {
    const existingAppearanceName = readCanvasStringField(existingParams, "appearanceName");

    if (existingAppearanceName === undefined) {
        return incomingParams;
    }

    return mergeAppearanceNameIntoParams(incomingParams, existingAppearanceName);
}

// 合并 params.canvas.appearanceName
function mergeAppearanceNameIntoParams(params: unknown, appearanceName: string | undefined) {
    if (appearanceName === undefined) {
        return params;
    }

    const base =
        params && typeof params === "object" ? (params as Record<string, unknown>) : {};
    const canvas =
        base.canvas && typeof base.canvas === "object"
            ? (base.canvas as Record<string, unknown>)
            : {};
    const { characterName: _legacy, ...canvasWithoutLegacy } = canvas;

    return {
        ...base,
        canvas: {
            ...canvasWithoutLegacy,
            appearanceName: appearanceName.trim(),
        },
    };
}

// 移除 params.canvas 中的旧版 characterName
function stripLegacyCharacterNameFromParams(params: unknown) {
    if (!params || typeof params !== "object") {
        return params;
    }

    const base = params as Record<string, unknown>;
    const canvas = base.canvas;

    if (!canvas || typeof canvas !== "object") {
        return params;
    }

    const { characterName: _legacy, ...canvasWithoutLegacy } = canvas as Record<string, unknown>;

    return {
        ...base,
        canvas: canvasWithoutLegacy,
    };
}

// 同步 asset 与 serie 的多对多绑定
async function syncAssetSeries(
    tx: Prisma.TransactionClient,
    assetId: number,
    projectId: number,
    serieIds: number[],
) {
    if (serieIds.length > 0) {
        const matchedCount = await tx.serie.count({
            where: {
                id: { in: serieIds },
                project_id: projectId,
            },
        });

        if (matchedCount !== serieIds.length) {
            throw new NotFoundError("集数不存在");
        }
    }

    await tx.asset_serie.deleteMany({
        where: { asset_id: assetId },
    });

    if (serieIds.length > 0) {
        await tx.asset_serie.createMany({
            data: serieIds.map((serieId) => ({
                asset_id: assetId,
                serie_id: serieId,
            })),
        });
    }
}

// 解析画布节点类型并校验
function resolveCanvasCategoryFields(canvasKind: string) {
    const categoryFields = resolveAssetCategoryFields(canvasKind);

    if (!categoryFields) {
        throw new BadRequestError("资产类型无效");
    }

    return categoryFields;
}

export class AssetService {
    // 查询项目下的资产列表，可选按 type 分类筛选（不含 none）
    async listByProject(userId: number, projectId: number, categoryType?: string) {
        await assertProjectOwner(userId, projectId);

        const assets = await prisma.asset.findMany({
            where: {
                project_id: projectId,
                ...(categoryType ? { type: categoryType } : {}),
            },
            include: ASSET_SERIES_INCLUDE,
            orderBy: { created_at: "asc" },
        });

        return assets.map(formatAssetForApi);
    }

    // 查询当前用户资产库列表（跨项目，按分类筛选并分页）
    async listLibraryByUser(
        userId: number,
        categoryType: string,
        options?: {
            page?: number;
            pageSize?: number;
            sort?: LibraryAssetSortOrder;
            keyword?: string;
            filter?: LibraryAssetFilter;
        },
    ) {
        const page = options?.page ?? 1;
        const pageSize = options?.pageSize ?? 48;
        const sort = options?.sort ?? "desc";
        const where = buildLibraryAssetWhere({
            userId,
            categoryType,
            keyword: options?.keyword,
            filter: options?.filter,
        });

        const [total, assets] = await Promise.all([
            prisma.asset.count({ where }),
            prisma.asset.findMany({
                where,
                include: ASSET_SERIES_INCLUDE,
                orderBy: { updated_at: sort },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        return {
            items: assets.map(formatAssetForApi),
            total,
            page,
            pageSize,
            hasMore: page * pageSize < total,
        };
    }

    // 在项目中新建资产（API type 为画布节点类型，入库时拆分为 type + asset_type）
    async createAsset(userId: number, projectId: number, canvasKind: string) {
        await assertProjectOwner(userId, projectId);

        const categoryFields = resolveCanvasCategoryFields(canvasKind);

        const asset = await prisma.asset.create({
            data: {
                project_id: projectId,
                type: categoryFields.type,
                asset_type: categoryFields.asset_type,
                name: getCanvasKindDefaultName(canvasKind),
            },
            include: ASSET_SERIES_INCLUDE,
        });

        return formatAssetForApi(asset);
    }

    /**
     * 引用源节点创建资产：源节点无 derive_id 时双方写入新 derive_id，否则新节点继承源 derive_id
     * @returns 新资产与（可能已更新的）源资产
     */
    async createReferencedAsset(
        userId: number,
        projectId: number,
        canvasKind: string,
        sourceAssetId: number,
    ) {
        await assertProjectOwner(userId, projectId);

        const sourceAsset = await prisma.asset.findFirst({
            where: {
                id: sourceAssetId,
                project_id: projectId,
                project: {
                    user_id: userId,
                },
            },
            include: ASSET_SERIES_INCLUDE,
        });

        if (!sourceAsset) {
            throw new NotFoundError("引用源资产不存在");
        }

        const categoryFields = resolveCanvasCategoryFields(canvasKind);
        const deriveId = sourceAsset.derive_id ?? generateDeriveId();

        const { updatedSourceAsset, newAsset } = await prisma.$transaction(async (tx) => {
            const updatedSourceAsset = sourceAsset.derive_id
                ? sourceAsset
                : await tx.asset.update({
                      where: { id: sourceAssetId },
                      data: { derive_id: deriveId },
                      include: ASSET_SERIES_INCLUDE,
                  });
            const createdAsset = await tx.asset.create({
                data: {
                    project_id: projectId,
                    type: categoryFields.type,
                    asset_type: categoryFields.asset_type,
                    name: getCanvasKindDefaultName(canvasKind),
                    derive_id: deriveId,
                },
                include: ASSET_SERIES_INCLUDE,
            });

            return {
                updatedSourceAsset,
                newAsset: createdAsset,
            };
        });

        return {
            asset: formatAssetForApi(newAsset),
            sourceAsset: formatAssetForApi(updatedSourceAsset),
        };
    }

    // 更新资产 derive_id（设为 null 表示退出衍生组）
    async updateAssetDerive(userId: number, assetId: number, deriveId: string | null) {
        await assertAssetOwner(userId, assetId);

        const updatedAsset = await prisma.asset.update({
            where: { id: assetId },
            data: { derive_id: deriveId },
            include: ASSET_SERIES_INCLUDE,
        });

        return formatAssetForApi(updatedAsset);
    }

    // 批量删除项目资产（校验项目归属与资产数量）
    async deleteAssets(userId: number, projectId: number, assetIds: number[]) {
        await assertProjectOwner(userId, projectId);

        if (assetIds.length === 0) {
            return [];
        }

        // uniqueAssetIds 去重后的待删除 ID 列表
        const uniqueAssetIds = [...new Set(assetIds)];
        const assets = await prisma.asset.findMany({
            where: {
                id: { in: uniqueAssetIds },
                project_id: projectId,
            },
            select: { id: true },
        });

        if (assets.length !== uniqueAssetIds.length) {
            throw new NotFoundError("资产不存在");
        }

        await prisma.asset.deleteMany({
            where: {
                id: { in: uniqueAssetIds },
                project_id: projectId,
            },
        });

        return uniqueAssetIds.map((id) => ({ id }));
    }

    // 批量更新资产 params（前端已解析好画布数据，后端仅持久化）
    async saveAssets(
        userId: number,
        projectId: number,
        items: Array<{ asset_id: number; params: unknown }>,
    ) {
        await assertProjectOwner(userId, projectId);

        if (items.length === 0) {
            return [];
        }

        const assetIds = items.map((item) => item.asset_id);
        const assets = await prisma.asset.findMany({
            where: {
                id: { in: assetIds },
                project_id: projectId,
            },
        });

        if (assets.length !== items.length) {
            throw new NotFoundError("资产不存在");
        }

        // assetById 待保存资产的现有记录映射
        const assetById = new Map(assets.map((asset) => [asset.id, asset]));

        const updatedAssets = await prisma.$transaction(
            items.map((item) => {
                const existingAsset = assetById.get(item.asset_id);
                const nextParams = preserveProfileParamsOnSave(
                    existingAsset?.params,
                    item.params,
                );

                return prisma.asset.update({
                    where: { id: item.asset_id },
                    data: { params: nextParams as Prisma.InputJsonValue },
                    include: ASSET_SERIES_INCLUDE,
                });
            }),
        );

        return updatedAssets.map(formatAssetForApi);
    }

    // 更新资产 url / cover（数据库存储 key，接口返回时拼接 CDN 私有空间签名 URL）
    async updateAssetMedia(
        userId: number,
        assetId: number,
        payload: { url: string; cover?: string },
    ) {
        await assertAssetOwner(userId, assetId);

        const updatedAsset = await prisma.asset.update({
            where: { id: assetId },
            data: {
                url: payload.url,
                ...(payload.cover !== undefined ? { cover: payload.cover } : {}),
            },
            include: ASSET_SERIES_INCLUDE,
        });

        return formatAssetForApi(updatedAsset);
    }

    /**
     * 更新角色/场景资料：角色/场景名写入 asset.name（角色同 derive 组同步），
     * 形象名称写入 params.canvas.appearanceName，出现集数同步 asset_serie
     */
    async updateAssetProfile(
        userId: number,
        assetId: number,
        payload: {
            characterName?: string;
            appearanceName?: string;
            serieIds?: number[];
        },
    ) {
        const asset = await assertAssetOwner(userId, assetId);

        const updatedAssets = await prisma.$transaction(async (tx) => {
            const profileTargetIds = asset.derive_id
                ? (
                      await tx.asset.findMany({
                          where: {
                              project_id: asset.project_id,
                              derive_id: asset.derive_id,
                          },
                          select: { id: true },
                      })
                  ).map((item) => item.id)
                : [assetId];

            const updatedRows = [];

            for (const targetId of profileTargetIds) {
                const targetAsset =
                    targetId === assetId
                        ? asset
                        : await tx.asset.findFirst({
                              where: { id: targetId, project_id: asset.project_id },
                          });

                if (!targetAsset) {
                    throw new NotFoundError("资产不存在");
                }

                const updateData: {
                    name?: string | null;
                    params?: Prisma.InputJsonValue;
                } = {};
                let nextParams: Prisma.InputJsonValue | null = targetAsset.params;

                if (payload.characterName !== undefined && targetAsset.type === "character") {
                    updateData.name = payload.characterName.trim() || null;
                    nextParams = stripLegacyCharacterNameFromParams(nextParams) as Prisma.InputJsonValue;
                    updateData.params = nextParams;
                }

                if (targetId === assetId && payload.appearanceName !== undefined) {
                    if (targetAsset.type === "character") {
                        nextParams = mergeAppearanceNameIntoParams(
                            nextParams,
                            payload.appearanceName,
                        ) as Prisma.InputJsonValue;
                        updateData.params = nextParams;
                    } else if (targetAsset.type === "scene") {
                        updateData.name = payload.appearanceName.trim() || null;
                    }
                }

                const shouldUpdateSeries =
                    targetId === assetId && payload.serieIds !== undefined;

                const updatedAsset = await tx.asset.update({
                    where: { id: targetId },
                    data: updateData,
                    include: ASSET_SERIES_INCLUDE,
                });

                if (shouldUpdateSeries) {
                    await syncAssetSeries(
                        tx,
                        targetId,
                        asset.project_id,
                        payload.serieIds ?? [],
                    );
                }

                updatedRows.push(
                    shouldUpdateSeries
                        ? await tx.asset.findFirstOrThrow({
                              where: { id: targetId },
                              include: ASSET_SERIES_INCLUDE,
                          })
                        : updatedAsset,
                );
            }

            return updatedRows.map(formatAssetForApi);
        });

        return updatedAssets;
    }

    // 更新资产分类 type（如将画布音频节点归入素材库 material）
    async updateAssetType(userId: number, assetId: number, type: string) {
        await assertAssetOwner(userId, assetId);

        const updatedAsset = await prisma.asset.update({
            where: { id: assetId },
            data: { type },
            include: ASSET_SERIES_INCLUDE,
        });

        return formatAssetForApi(updatedAsset);
    }
}

// assetService 资产服务单例
export const assetService = new AssetService();
