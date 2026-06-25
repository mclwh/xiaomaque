import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import { focusNodeSelection, patchNodeSelection } from "@/lib/canvasNodeSelection";

// buildNode 构造带 selected 的测试节点
function buildNode(id: string, selected = false): Node {
    return {
        id,
        type: "canvasAsset",
        position: { x: 0, y: 0 },
        selected,
        data: {},
    };
}

describe("canvasNodeSelection", () => {
    it("patchNodeSelection 仅变更涉及节点引用", () => {
        const nodes = [buildNode("a", true), buildNode("b"), buildNode("c")];
        const next = patchNodeSelection(nodes, new Set(["b"]));

        expect(next[0]).not.toBe(nodes[0]);
        expect(next[0]?.selected).toBe(false);
        expect(next[1]).not.toBe(nodes[1]);
        expect(next[1]?.selected).toBe(true);
        expect(next[2]).toBe(nodes[2]);
    });

    it("focusNodeSelection 仅选中目标节点", () => {
        const nodes = [buildNode("a", true), buildNode("b"), buildNode("c", true)];
        const next = focusNodeSelection(nodes, "b");

        expect(next.filter((node) => node.selected)).toHaveLength(1);
        expect(next[1]?.selected).toBe(true);
        expect(next[0]).not.toBe(nodes[0]);
        expect(next[2]).not.toBe(nodes[2]);
        expect(next[0]?.selected).toBe(false);
        expect(next[2]?.selected).toBe(false);
    });
});
