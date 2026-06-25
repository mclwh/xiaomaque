import { prisma } from "../config/prisma.js";
import { NotFoundError } from "./errors.js";

// ASSET_OWNER_INCLUDE 校验归属时附带的关联字段
const ASSET_OWNER_INCLUDE = {
    project: {
        select: {
            user_id: true,
            id: true,
        },
    },
    asset_series: {
        select: { serie_id: true },
    },
} as const;

// 校验资产存在且属于当前用户
export async function assertAssetOwner(userId: number, assetId: number) {
    const asset = await prisma.asset.findFirst({
        where: { id: assetId },
        include: ASSET_OWNER_INCLUDE,
    });

    if (!asset || asset.project.user_id !== userId) {
        throw new NotFoundError("资产不存在");
    }

    return asset;
}
