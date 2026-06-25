import { describe, expect, it } from "vitest";
import {
    canRedo,
    canUndo,
    cloneCanvasSnapshot,
    createEmptyCanvasHistory,
    MAX_CANVAS_HISTORY,
    pushHistory,
    redoHistory,
    type CanvasSnapshot,
    undoHistory,
} from "@/lib/canvasHistory";

// sampleSnapshot 测试用画布快照
const sampleSnapshot = (label: string): CanvasSnapshot => ({
    nodes: [
        {
            id: `asset-1-${label}`,
            type: "canvasAsset",
            position: { x: 0, y: 0 },
            data: { assetId: 1, kind: "character", label: "角色" },
        },
    ],
    edges: [{ id: `edge-${label}`, source: "a", target: "b" }],
    assets: [],
    pendingDeleteAssetIds: [],
});

describe("canvasHistory", () => {
    it("pushHistory 将快照压入 past 并清空 future", () => {
        const history = createEmptyCanvasHistory();
        const snapshot = sampleSnapshot("a");

        const next = pushHistory(history, snapshot);

        expect(next.past).toHaveLength(1);
        expect(next.future).toHaveLength(0);
        expect(next.past[0].nodes[0].id).toBe("asset-1-a");
    });

    it("undo 恢复 previous 并将 current 放入 future", () => {
        const current = sampleSnapshot("current");
        const previous = sampleSnapshot("previous");
        const history = pushHistory(createEmptyCanvasHistory(), previous);

        const result = undoHistory(current, history);

        expect(result).not.toBeNull();
        expect(result!.snapshot.nodes[0].id).toBe("asset-1-previous");
        expect(result!.history.past).toHaveLength(0);
        expect(result!.history.future).toHaveLength(1);
        expect(result!.history.future[0].nodes[0].id).toBe("asset-1-current");
    });

    it("redo 恢复 next 并将 current 放入 past", () => {
        const current = sampleSnapshot("current");
        const nextSnapshot = sampleSnapshot("next");
        const history = {
            past: [],
            future: [cloneCanvasSnapshot(nextSnapshot)],
        };

        const result = redoHistory(current, history);

        expect(result).not.toBeNull();
        expect(result!.snapshot.nodes[0].id).toBe("asset-1-next");
        expect(result!.history.past).toHaveLength(1);
        expect(result!.history.future).toHaveLength(0);
    });

    it("超过 MAX_HISTORY 时截断最旧条目", () => {
        let history = createEmptyCanvasHistory();

        for (let index = 0; index < MAX_CANVAS_HISTORY + 5; index += 1) {
            history = pushHistory(history, sampleSnapshot(String(index)));
        }

        expect(history.past).toHaveLength(MAX_CANVAS_HISTORY);
        expect(history.past[0].nodes[0].id).toBe(`asset-1-${5}`);
    });

    it("空 past 时 undo 返回 null", () => {
        const result = undoHistory(sampleSnapshot("current"), createEmptyCanvasHistory());

        expect(result).toBeNull();
    });

    it("canUndo / canRedo 反映栈状态", () => {
        const history = pushHistory(createEmptyCanvasHistory(), sampleSnapshot("a"));

        expect(canUndo(history)).toBe(true);
        expect(canRedo(history)).toBe(false);
    });
});
