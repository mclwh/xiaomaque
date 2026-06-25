import { describe, expect, it } from "vitest";
import { computePromptPopoverPosition } from "@/lib/promptPopoverPosition";

describe("computePromptPopoverPosition", () => {
    it("右侧空间不足时向左对齐触发器右缘", () => {
        const position = computePromptPopoverPosition({
            triggerRect: { top: 10, left: 1000, right: 1100, bottom: 40, width: 100, height: 30 },
            panelWidth: 360,
            panelHeight: 200,
            placement: "bottom",
            viewportWidth: 1147,
            viewportHeight: 800,
        });

        expect(position.left).toBe(1100 - 360);
    });

    it("下方空间不足时翻转到触发器上方", () => {
        const position = computePromptPopoverPosition({
            triggerRect: { top: 750, left: 100, right: 200, bottom: 780, width: 100, height: 30 },
            panelWidth: 320,
            panelHeight: 200,
            placement: "bottom",
            viewportWidth: 1200,
            viewportHeight: 800,
        });

        expect(position.top).toBe(750 - 200 - 8);
    });
});
