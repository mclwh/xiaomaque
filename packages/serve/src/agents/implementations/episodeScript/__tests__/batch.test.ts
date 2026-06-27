import { describe, expect, it } from "vitest";
import { buildEpisodeBatchRanges, getEpisodeBatchSize } from "../batch.js";

describe("buildEpisodeBatchRanges", () => {
    it("48 集应拆为 4 批，每批 12 集", () => {
        const batches = buildEpisodeBatchRanges(48);

        expect(batches).toEqual([
            { start: 1, end: 12 },
            { start: 13, end: 24 },
            { start: 25, end: 36 },
            { start: 37, end: 48 },
        ]);
    });

    it("不足 12 集时单批生成", () => {
        const batches = buildEpisodeBatchRanges(5);

        expect(batches).toEqual([{ start: 1, end: 5 }]);
        expect(getEpisodeBatchSize(batches[0])).toBe(5);
    });
});
