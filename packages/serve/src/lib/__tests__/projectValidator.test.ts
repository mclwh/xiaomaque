import { describe, expect, it } from "vitest";
import { batchDeleteProjectsSchema } from "../../validators/project.js";

describe("batchDeleteProjectsSchema", () => {
    it("至少需要一个项目 ID", () => {
        expect(batchDeleteProjectsSchema.safeParse({ project_ids: [] }).success).toBe(false);
    });

    it("接受有效的项目 ID 列表", () => {
        expect(batchDeleteProjectsSchema.safeParse({ project_ids: [1, 2] }).success).toBe(true);
    });

    it("拒绝无效的项目 ID", () => {
        expect(batchDeleteProjectsSchema.safeParse({ project_ids: [0, -1] }).success).toBe(false);
    });
});
