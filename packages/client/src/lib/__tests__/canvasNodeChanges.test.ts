import { describe, expect, it } from "vitest";
import {
    hasLayoutNodeChange,
    isDraggingOnlyChanges,
    partitionNodeChanges,
    shouldDeferToRedux,
} from "@/lib/canvasNodeChanges";
import type { NodeChange } from "@xyflow/react";

describe("canvasNodeChanges", () => {
    it("partitionNodeChanges 区分 dragging / dragEnd / other", () => {
        /*
         * changes 混合变更列表
         */
        const changes: NodeChange[] = [
            { id: "n1", type: "position", position: { x: 1, y: 2 }, dragging: true },
            { id: "n1", type: "position", position: { x: 10, y: 20 }, dragging: false },
            { id: "n2", type: "select", selected: true },
        ];

        const partitioned = partitionNodeChanges(changes);

        expect(partitioned.draggingPosition).toHaveLength(1);
        expect(partitioned.dragEndPosition).toHaveLength(1);
        expect(partitioned.other).toHaveLength(1);
    });

    it("shouldDeferToRedux 拖拽中 position 变更返回 false", () => {
        const changes: NodeChange[] = [
            { id: "n1", type: "position", position: { x: 1, y: 2 }, dragging: true },
        ];

        expect(shouldDeferToRedux(changes)).toBe(false);
    });

    it("shouldDeferToRedux dragEnd 或 select 返回 true", () => {
        expect(
            shouldDeferToRedux([
                { id: "n1", type: "position", position: { x: 1, y: 2 }, dragging: false },
            ]),
        ).toBe(true);
        expect(
            shouldDeferToRedux([{ id: "n2", type: "select", selected: true }]),
        ).toBe(true);
    });

    it("hasLayoutNodeChange dragEnd 算 layout，dragging 不算", () => {
        expect(
            hasLayoutNodeChange([
                { id: "n1", type: "position", position: { x: 1, y: 2 }, dragging: true },
            ]),
        ).toBe(false);
        expect(
            hasLayoutNodeChange([
                { id: "n1", type: "position", position: { x: 1, y: 2 }, dragging: false },
            ]),
        ).toBe(true);
    });

    it("isDraggingOnlyChanges 仅在纯 dragging position 时为 true", () => {
        expect(
            isDraggingOnlyChanges([
                { id: "n1", type: "position", position: { x: 1, y: 2 }, dragging: true },
            ]),
        ).toBe(true);
        expect(
            isDraggingOnlyChanges([
                { id: "n1", type: "position", position: { x: 1, y: 2 }, dragging: true },
                { id: "n2", type: "select", selected: true },
            ]),
        ).toBe(false);
    });
});
