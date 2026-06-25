import { describe, expect, it } from "vitest";
import { listLibraryAssetsSchema } from "../../validators/asset.js";

describe("listLibraryAssetsSchema", () => {
    it("要求有效的资产分类", () => {
        expect(listLibraryAssetsSchema.safeParse({ type: "character" }).success).toBe(true);
        expect(listLibraryAssetsSchema.safeParse({ type: "scene" }).success).toBe(true);
        expect(listLibraryAssetsSchema.safeParse({ type: "prop" }).success).toBe(true);
        expect(listLibraryAssetsSchema.safeParse({ type: "material" }).success).toBe(true);
    });

    it("拒绝无效分类与画布未归类类型", () => {
        expect(listLibraryAssetsSchema.safeParse({}).success).toBe(false);
        expect(listLibraryAssetsSchema.safeParse({ type: "none" }).success).toBe(false);
        expect(listLibraryAssetsSchema.safeParse({ type: "canvas" }).success).toBe(false);
    });

    it("支持分页、排序与筛选参数", () => {
        const parsed = listLibraryAssetsSchema.parse({
            type: "character",
            page: 2,
            page_size: 24,
            sort: "asc",
            keyword: "主角",
            filter: "pending",
        });

        expect(parsed.page).toBe(2);
        expect(parsed.page_size).toBe(24);
        expect(parsed.sort).toBe("asc");
        expect(parsed.keyword).toBe("主角");
        expect(parsed.filter).toBe("pending");
    });
});
