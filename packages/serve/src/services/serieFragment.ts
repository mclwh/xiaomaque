import { prisma } from "../config/prisma.js";
import { BadRequestError, NotFoundError } from "../lib/errors.js";
import { formatAssetForApi } from "../lib/formatAsset.js";
import type { SerieFragmentDbRow } from "../lib/serieFragment.js";
import {
    parseSerieFragmentSaveList,
    serializeSerieFragmentIdStubs,
    serializeSerieFragmentRows,
} from "../lib/serieFragment.js";

// FRAGMENT_INCLUDE 分镜查询关联（引用顺序按插入 id）
const FRAGMENT_INCLUDE = {
    asset_references: {
        orderBy: { id: "asc" as const },
        include: {
            asset: {
                select: {
                    id: true,
                    type: true,
                    asset_type: true,
                    name: true,
                    cover: true,
                    url: true,
                    params: true,
                    project_id: true,
                    derive_id: true,
                    created_at: true,
                    updated_at: true,
                    asset_series: {
                        select: { serie_id: true },
                    },
                },
            },
        },
    },
} as const;

// REFERENCE_ASSET_SELECT 引用关联资产的查询字段
const REFERENCE_ASSET_SELECT = FRAGMENT_INCLUDE.asset_references.include.asset.select;

// 校验资产是否属于项目
async function assertAssetsBelongToProject(projectId: number, assetIds: number[]) {
    if (assetIds.length === 0) {
        return;
    }

    // uniqueAssetIds 去重后的资产 ID
    const uniqueAssetIds = [...new Set(assetIds)];
    const assets = await prisma.asset.findMany({
        where: {
            id: { in: uniqueAssetIds },
            project_id: projectId,
        },
        select: { id: true },
    });

    if (assets.length !== uniqueAssetIds.length) {
        throw new NotFoundError("引用资产不存在");
    }
}

// 将 Prisma 查询结果转为 SerieFragmentDbRow
function mapFragmentRows(
    fragments: Array<{
        id: number;
        sort_order: number;
        content: string;
        cover: string;
        video: string;
        duration_sec: number | null;
        params: unknown;
        asset_references: Array<{
            asset_id: number;
            asset: Parameters<typeof formatAssetForApi>[0];
        }>;
    }>,
): SerieFragmentDbRow[] {
    return fragments.map((fragment) => ({
        id: fragment.id,
        sort_order: fragment.sort_order,
        content: fragment.content,
        cover: fragment.cover,
        video: fragment.video,
        duration_sec: fragment.duration_sec,
        params: fragment.params,
        asset_references: fragment.asset_references.map((reference) => ({
            asset_id: reference.asset_id,
            asset: reference.asset,
        })),
    }));
}

// 查询分集下的分镜行
export async function listSerieFragmentRows(serieId: number) {
    const fragments = await prisma.serie_fragment.findMany({
        where: { serie_id: serieId },
        orderBy: { sort_order: "asc" },
        include: FRAGMENT_INCLUDE,
    });

    return mapFragmentRows(fragments);
}

// 按分镜 ID 查询引用资产列表（用于视频生成等场景）
export async function listSerieFragmentReferenceAssetsByFragmentId(fragmentId: number) {
    const references = await prisma.serie_fragment_reference.findMany({
        where: { fragment_id: fragmentId },
        orderBy: { id: "asc" },
        include: {
            asset: {
                select: REFERENCE_ASSET_SELECT,
            },
        },
    });

    return references.map((reference) => formatAssetForApi(reference.asset));
}

// 按 ID 查询分镜行及其所属分集、项目（用于生成等仅需 fragment_id 的场景）
export async function getSerieFragmentContextById(fragmentId: number) {
    const fragment = await prisma.serie_fragment.findFirst({
        where: { id: fragmentId },
        include: {
            serie: {
                select: {
                    id: true,
                    project_id: true,
                },
            },
            ...FRAGMENT_INCLUDE,
        },
    });

    if (!fragment) {
        return null;
    }

    const { serie, ...fragmentRow } = fragment;

    return {
        projectId: serie.project_id,
        serieId: serie.id,
        fragment: mapFragmentRows([fragmentRow])[0] ?? null,
    };
}

// 按 ID 查询分集下的单个分镜行（含关联资产引用）
export async function getSerieFragmentRowById(serieId: number, fragmentId: number) {
    const fragment = await prisma.serie_fragment.findFirst({
        where: {
            id: fragmentId,
            serie_id: serieId,
        },
        include: FRAGMENT_INCLUDE,
    });

    if (!fragment) {
        return null;
    }

    return mapFragmentRows([fragment])[0] ?? null;
}

// 创建默认空白分镜
export async function createDefaultSerieFragment(serieId: number) {
    await prisma.serie_fragment.create({
        data: {
            serie_id: serieId,
            sort_order: 0,
            content: "",
            cover: "",
            video: "",
        },
    });
}

// 保存分集分镜列表（全量替换式同步）
export async function replaceSerieFragments(
    projectId: number,
    serieId: number,
    fragmentsPayload: unknown[],
) {
    const parsedFragments = parseSerieFragmentSaveList(fragmentsPayload);

    if (parsedFragments.length === 0) {
        throw new BadRequestError("至少保留一个分镜");
    }

    // relatedAssetIds 分镜关联的全部资产 ID
    const relatedAssetIds = parsedFragments.flatMap((fragment) =>
        fragment.references.map((reference) => reference.assetId),
    );

    await assertAssetsBelongToProject(projectId, relatedAssetIds);

    const existingFragments = await prisma.serie_fragment.findMany({
        where: { serie_id: serieId },
        select: { id: true },
    });
    // existingFragmentIdSet 当前分集已有分镜 ID
    const existingFragmentIdSet = new Set(existingFragments.map((fragment) => fragment.id));

    for (const fragment of parsedFragments) {
        if (fragment.id !== null && !existingFragmentIdSet.has(fragment.id)) {
            throw new NotFoundError("分镜不存在");
        }
    }

    // keepFragmentIds 需要保留的分镜 ID
    const keepFragmentIds = parsedFragments.flatMap((fragment) =>
        fragment.id ? [fragment.id] : [],
    );
    // removableFragmentIds 需要删除的分镜 ID
    const removableFragmentIds = existingFragments
        .map((fragment) => fragment.id)
        .filter((fragmentId) => !keepFragmentIds.includes(fragmentId));

    await prisma.$transaction(async (tx) => {
        if (removableFragmentIds.length > 0) {
            await tx.serie_fragment.deleteMany({
                where: {
                    serie_id: serieId,
                    id: { in: removableFragmentIds },
                },
            });
        }

        for (const fragment of parsedFragments) {
            // fragmentData 分镜主表字段
            const fragmentData = {
                serie_id: serieId,
                sort_order: fragment.sortOrder,
                content: fragment.content,
                cover: fragment.cover,
                video: fragment.video,
                ...(fragment.durationSec !== null ? { duration_sec: fragment.durationSec } : {}),
            };

            // fragmentId 当前分镜 ID（新建或更新）
            const fragmentId =
                fragment.id !== null
                    ? (
                          await tx.serie_fragment.update({
                              where: { id: fragment.id },
                              data: fragmentData,
                          })
                      ).id
                    : (
                          await tx.serie_fragment.create({
                              data: fragmentData,
                          })
                      ).id;

            await tx.serie_fragment_reference.deleteMany({
                where: { fragment_id: fragmentId },
            });

            if (fragment.references.length > 0) {
                await tx.serie_fragment_reference.createMany({
                    data: fragment.references.map((reference) => ({
                        fragment_id: fragmentId,
                        asset_id: reference.assetId,
                    })),
                });
            }
        }
    });

    return listSerieFragmentRows(serieId);
}

// 将分镜行序列化为 API fragments 数组
export function serializeFragmentsForApi(fragments: SerieFragmentDbRow[]) {
    return serializeSerieFragmentRows(fragments);
}

// 将分镜行序列化为列表接口用的轻量 stubs
export function serializeFragmentStubsForApi(fragments: SerieFragmentDbRow[]) {
    return serializeSerieFragmentIdStubs(fragments);
}
