// 将 serie.fragments JSON 迁移到 serie_fragment 关系表（启动时执行一次）
import { prisma } from "../config/prisma.js";
import { parseSerieFragmentSaveList } from "./serieFragment.js";

// 判断 serie 表是否仍存在 fragments 列
async function hasLegacySerieFragmentsColumn() {
    const columns = await prisma.$queryRaw<Array<{ Field: string }>>`
        SHOW COLUMNS FROM serie LIKE 'fragments'
    `;

    return columns.length > 0;
}

// 从遗留 JSON 迁移单个分集的 fragments
async function migrateLegacySerieFragmentsForSerie(serieId: number, fragments: unknown) {
    const existingCount = await prisma.serie_fragment.count({
        where: { serie_id: serieId },
    });

    if (existingCount > 0 || !Array.isArray(fragments) || fragments.length === 0) {
        return;
    }

    const parsedFragments = parseSerieFragmentSaveList(fragments);

    if (parsedFragments.length === 0) {
        return;
    }

    await prisma.$transaction(async (tx) => {
        for (const fragment of parsedFragments) {
            const created = await tx.serie_fragment.create({
                data: {
                    serie_id: serieId,
                    sort_order: fragment.sortOrder,
                    content: fragment.content,
                    cover: fragment.cover,
                    video: fragment.video,
                    duration_sec: fragment.durationSec,
                },
            });

            if (fragment.references.length > 0) {
                await tx.serie_fragment_reference.createMany({
                    data: fragment.references.map((reference) => ({
                        fragment_id: created.id,
                        asset_id: reference.assetId,
                    })),
                });
            }
        }
    });
}

// 清理遗留的 serie.fragments 列（迁移完成后执行）
async function dropLegacySerieFragmentsColumn() {
    const hasLegacyColumn = await hasLegacySerieFragmentsColumn();

    if (!hasLegacyColumn) {
        return;
    }

    await prisma.$executeRaw`
        ALTER TABLE serie DROP COLUMN fragments
    `;
}

// 迁移所有仍保存在 serie.fragments 中的遗留数据
export async function migrateLegacySerieFragmentsFromJson() {
    const hasLegacyColumn = await hasLegacySerieFragmentsColumn();

    if (!hasLegacyColumn) {
        return;
    }

    // legacySeries 仍含 JSON fragments 的分集
    const legacySeries = await prisma.$queryRaw<Array<{ id: number; fragments: unknown }>>`
        SELECT id, fragments
        FROM serie
        WHERE fragments IS NOT NULL
    `;

    for (const serie of legacySeries) {
        await migrateLegacySerieFragmentsForSerie(serie.id, serie.fragments);
    }

    await dropLegacySerieFragmentsColumn();
}
