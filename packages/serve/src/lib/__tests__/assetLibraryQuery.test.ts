import { describe, expect, it } from "vitest";
import { buildLibraryAssetWhere } from "../assetLibraryQuery.js";

describe("buildLibraryAssetWhere", () => {
    it("按用户与分类构建基础条件", () => {
        const where = buildLibraryAssetWhere({
            userId: 1,
            categoryType: "character",
        });

        expect(where).toEqual({
            type: "character",
            project: { user_id: 1 },
        });
    });

    it("支持关键词与待补充筛选", () => {
        const where = buildLibraryAssetWhere({
            userId: 2,
            categoryType: "material",
            keyword: " 封面 ",
            filter: "pending",
        });

        expect(where.type).toBe("material");
        expect(where.name).toEqual({ contains: "封面" });
        expect(where.AND).toHaveLength(2);
    });
});
