import { describe, expect, it } from "vitest";
import {
    createDurationChipElement,
    createMentionChipElement,
    renderPromptEditorContent,
    serializePromptEditorContent,
    updateDurationChipElement,
} from "@/lib/episodePromptEditor";

describe("episodePromptEditor", () => {
    it("序列化 inline 引用标签为 @asset:id", () => {
        const root = document.createElement("div");
        root.appendChild(document.createTextNode("hello "));
        root.appendChild(
            createMentionChipElement({
                assetId: 42,
                label: "基础形象",
                previewUrl: null,
            }),
        );
        root.appendChild(document.createTextNode(" world"));

        expect(serializePromptEditorContent(root)).toBe("hello @asset:42 world");
    });

    it("时长标签含场记板图标并可序列化", () => {
        const root = document.createElement("div");
        root.appendChild(createDurationChipElement(5));

        expect(root.querySelector("[data-duration-sec='5'] svg")).not.toBeNull();
        expect(root.textContent).toContain("5s");
        expect(serializePromptEditorContent(root)).toBe("@duration:5");
    });

    it("可更新已有 inline 时长标签", () => {
        const chip = createDurationChipElement(5);
        updateDurationChipElement(chip, 10);

        expect(chip.dataset.durationSec).toBe("10");
        expect(chip.querySelector("[data-duration-label]")?.textContent).toBe("10s");
    });

    it("从 content 渲染 inline 引用标签", () => {
        const root = document.createElement("div");

        renderPromptEditorContent(root, "镜头 @asset:7 结束", (assetId) => {
            if (assetId !== 7) {
                return null;
            }

            return {
                assetId: 7,
                label: "基础形象",
                previewUrl: null,
            };
        });

        expect(root.querySelector("[data-asset-id='7']")).not.toBeNull();
        expect(root.textContent).toContain("镜头");
        expect(root.textContent).toContain("结束");
        expect(root.textContent).toContain("基础形象");
    });

    it("渲染与序列化保留换行符", () => {
        const root = document.createElement("div");

        renderPromptEditorContent(root, "第一行\n第二行 @asset:7\n第三行", (assetId) => {
            if (assetId !== 7) {
                return null;
            }

            return {
                assetId: 7,
                label: "基础形象",
                previewUrl: null,
            };
        });

        expect(root.querySelectorAll("br").length).toBe(2);
        expect(serializePromptEditorContent(root)).toBe("第一行\n第二行 @asset:7\n第三行");
    });

    it("序列化 contentEditable 中的 br 与 div 换行", () => {
        const root = document.createElement("div");
        root.appendChild(document.createTextNode("第一行"));
        root.appendChild(document.createElement("br"));
        root.appendChild(document.createTextNode("第二行"));

        expect(serializePromptEditorContent(root)).toBe("第一行\n第二行");

        const blockRoot = document.createElement("div");
        const firstLine = document.createElement("div");
        firstLine.textContent = "段落一";
        const secondLine = document.createElement("div");
        secondLine.textContent = "段落二";
        blockRoot.appendChild(firstLine);
        blockRoot.appendChild(secondLine);

        expect(serializePromptEditorContent(blockRoot)).toBe("段落一\n段落二");
    });
});
