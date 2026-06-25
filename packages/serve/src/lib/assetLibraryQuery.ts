import type { Prisma } from "@prisma/client";

// LIBRARY_ASSET_DEFAULT_PAGE 资产库默认页码
export const LIBRARY_ASSET_DEFAULT_PAGE = 1;

// LIBRARY_ASSET_DEFAULT_PAGE_SIZE 资产库默认每页条数
export const LIBRARY_ASSET_DEFAULT_PAGE_SIZE = 48;

// LIBRARY_ASSET_MAX_PAGE_SIZE 资产库单页最大条数
export const LIBRARY_ASSET_MAX_PAGE_SIZE = 100;

// LibraryAssetFilter 资产库筛选条件
export type LibraryAssetFilter = "all" | "pending";

// LibraryAssetSortOrder 资产库排序方向
export type LibraryAssetSortOrder = "asc" | "desc";

// BuildLibraryAssetWhereInput 构建资产库查询条件
export type BuildLibraryAssetWhereInput = {
    userId: number;
    categoryType: string;
    keyword?: string;
    filter?: LibraryAssetFilter;
};

// 构建资产库 Prisma 查询条件
export function buildLibraryAssetWhere({
    userId,
    categoryType,
    keyword,
    filter = "all",
}: BuildLibraryAssetWhereInput): Prisma.assetWhereInput {
    const where: Prisma.assetWhereInput = {
        type: categoryType,
        project: {
            user_id: userId,
        },
    };

    const trimmedKeyword = keyword?.trim();

    if (trimmedKeyword) {
        where.name = {
            contains: trimmedKeyword,
        };
    }

    if (filter === "pending") {
        if (categoryType === "material") {
            where.AND = [
                { OR: [{ cover: null }, { cover: "" }] },
                { OR: [{ url: null }, { url: "" }] },
            ];
        } else {
            where.OR = [{ cover: null }, { cover: "" }];
        }
    }

    return where;
}
