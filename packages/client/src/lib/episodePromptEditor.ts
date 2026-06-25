// 分集脚本编辑器：inline 引用标签与内容序列化
import { AudioLines, Clapperboard } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { MentionChipData } from "@/lib/episodeMentionAssets";

// DURATION_CHIP_SELECTOR 时长标签选择器
export const DURATION_CHIP_SELECTOR = "[data-duration-sec]";

// MENTION_CHIP_SELECTOR 引用标签选择器
export const MENTION_CHIP_SELECTOR = "[data-mention='true']";

// ASSET_MENTION_TOKEN_PATTERN 内容中资产引用占位符（供其他模块复用）
export const ASSET_MENTION_TOKEN_PATTERN = /@asset:(\d+)/g;

// BLOCK_ELEMENT_TAGS contentEditable 中代表换行的块级标签
const BLOCK_ELEMENT_TAGS = new Set(["DIV", "P"]);

// MENTION_CHIP_THUMB_PREVIEW_WIDTH 悬浮预览图固定宽度（px）
const MENTION_CHIP_THUMB_PREVIEW_WIDTH = 200;

// mentionChipThumbPreviewEl 全局悬浮预览容器
let mentionChipThumbPreviewEl: HTMLDivElement | null = null;

// mentionChipThumbPreviewScrollCleanup 滚动时隐藏预览的清理函数
let mentionChipThumbPreviewScrollCleanup: (() => void) | null = null;

// 确保全局悬浮预览 DOM 已创建
function ensureMentionChipThumbPreviewElement(): HTMLDivElement {
    if (!mentionChipThumbPreviewEl) {
        mentionChipThumbPreviewEl = document.createElement("div");
        mentionChipThumbPreviewEl.className =
            "xyq-mention-chip-thumb-preview pointer-events-none fixed z-[70] hidden rounded-xl border border-black/10 bg-white p-1 shadow-lg";
        mentionChipThumbPreviewEl.setAttribute("aria-hidden", "true");
        document.body.appendChild(mentionChipThumbPreviewEl);
    }

    return mentionChipThumbPreviewEl;
}

// 绑定滚动时自动隐藏悬浮预览
function bindMentionChipThumbPreviewScrollHide() {
    mentionChipThumbPreviewScrollCleanup?.();

    const onScroll = () => {
        hideMentionChipThumbPreview();
    };

    window.addEventListener("scroll", onScroll, true);
    mentionChipThumbPreviewScrollCleanup = () => {
        window.removeEventListener("scroll", onScroll, true);
        mentionChipThumbPreviewScrollCleanup = null;
    };
}

// MENTION_CHIP_THUMB_PREVIEW_GAP 预览图与缩略图间距（px）
const MENTION_CHIP_THUMB_PREVIEW_GAP = 8;

// 显示引用标签缩略图悬浮预览
function showMentionChipThumbPreview(anchorEl: HTMLElement, previewUrl: string, alt: string) {
    const previewEl = ensureMentionChipThumbPreviewElement();
    let image = previewEl.querySelector<HTMLImageElement>("img");

    if (!image) {
        image = document.createElement("img");
        image.className = "block h-auto rounded-lg object-contain";
        image.style.width = `${MENTION_CHIP_THUMB_PREVIEW_WIDTH}px`;
        previewEl.appendChild(image);
    }

    image.src = previewUrl;
    image.alt = alt;

    previewEl.classList.remove("hidden");
    previewEl.style.visibility = "hidden";
    previewEl.style.transform = "none";

    const positionPreview = () => {
        const anchorRect = anchorEl.getBoundingClientRect();
        const previewWidth = previewEl.offsetWidth;
        const previewHeight = previewEl.offsetHeight;
        const viewportPadding = MENTION_CHIP_THUMB_PREVIEW_GAP;

        let left = anchorRect.right + MENTION_CHIP_THUMB_PREVIEW_GAP;

        if (left + previewWidth > window.innerWidth - viewportPadding) {
            left = anchorRect.left - MENTION_CHIP_THUMB_PREVIEW_GAP - previewWidth;
        }

        left = Math.max(viewportPadding, Math.min(left, window.innerWidth - previewWidth - viewportPadding));

        let top = anchorRect.top + anchorRect.height / 2 - previewHeight / 2;
        top = Math.max(viewportPadding, Math.min(top, window.innerHeight - previewHeight - viewportPadding));

        previewEl.style.left = `${left}px`;
        previewEl.style.top = `${top}px`;
        previewEl.style.visibility = "visible";
    };

    if (image.complete) {
        positionPreview();
    } else {
        image.onload = () => {
            positionPreview();
            image.onload = null;
        };
    }

    bindMentionChipThumbPreviewScrollHide();
}

// 隐藏引用标签缩略图悬浮预览
function hideMentionChipThumbPreview() {
    mentionChipThumbPreviewScrollCleanup?.();

    if (!mentionChipThumbPreviewEl) {
        return;
    }

    mentionChipThumbPreviewEl.classList.add("hidden");
    mentionChipThumbPreviewEl.style.visibility = "";
}

// 为引用标签缩略图挂载悬浮大图预览
function attachMentionChipThumbPreview(thumbEl: HTMLElement, previewUrl: string, alt: string) {
    thumbEl.dataset.mentionThumb = "true";

    thumbEl.addEventListener("mouseenter", () => {
        showMentionChipThumbPreview(thumbEl, previewUrl, alt);
    });

    thumbEl.addEventListener("mouseleave", () => {
        hideMentionChipThumbPreview();
    });
}

// 将含换行符的文本追加为 Text + <br> 节点（contentEditable 中更可靠地展示换行）
function appendTextWithLineBreaks(parent: HTMLElement, text: string) {
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
        if (line.length > 0) {
            parent.appendChild(document.createTextNode(line));
        }

        if (index < lines.length - 1) {
            parent.appendChild(document.createElement("br"));
        }
    });
}

// 判断节点是否位于引用标签内部
function isInsideMentionChip(node: Node | null) {
    if (!node) {
        return false;
    }

    const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;

    return Boolean(element?.closest(MENTION_CHIP_SELECTOR));
}

// 用 lucide AudioLines 渲染角色音频绑定状态图标
function createVoiceAudioIconElement(hasVoiceAudio: boolean) {
    // iconWrap 音频绑定图标容器
    const iconWrap = document.createElement("span");
    iconWrap.className = hasVoiceAudio
        ? "inline-flex size-4 shrink-0 items-center justify-center text-violet-600"
        : "inline-flex size-4 shrink-0 items-center justify-center text-slate-300";
    iconWrap.setAttribute("aria-label", hasVoiceAudio ? "已绑定音频" : "未绑定音频");
    iconWrap.title = hasVoiceAudio ? "已绑定音频" : "未绑定音频";

    iconWrap.innerHTML = renderToStaticMarkup(
        createElement(AudioLines, {
            className: "size-3.5",
            strokeWidth: 1.8,
        }),
    );

    return iconWrap;
}

// 创建 inline 资产引用标签 DOM
export function createMentionChipElement(chip: MentionChipData) {
    // isCharacterChip 是否为角色资产引用标签
    const isCharacterChip = Boolean(chip.characterName && chip.appearanceName);
    // chipEl 引用标签容器
    const chipEl = document.createElement("span");
    chipEl.className =
        "xyq-mention-chip inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 align-middle text-sm leading-5 text-slate-800 shadow-sm";
    chipEl.contentEditable = "false";
    chipEl.dataset.mention = "true";
    chipEl.dataset.assetId = String(chip.assetId);

    // thumbEl 缩略图容器
    const thumbEl = document.createElement("span");
    thumbEl.className =
        "inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#efeff4]";

    if (chip.previewUrl) {
        const image = document.createElement("img");
        image.src = chip.previewUrl;
        image.alt = chip.label;
        image.className = "size-full object-cover";
        thumbEl.appendChild(image);
        attachMentionChipThumbPreview(thumbEl, chip.previewUrl, chip.label);
    } else {
        thumbEl.textContent = "图";
        thumbEl.className +=
            " text-[10px] font-medium text-slate-400";
    }

    chipEl.appendChild(thumbEl);

    if (isCharacterChip) {
        // labelsWrap 角色名与形象名（单行）
        const labelsWrap = document.createElement("span");
        labelsWrap.className = "inline-flex min-w-0 items-center gap-1";

        // characterEl 角色名称
        const characterEl = document.createElement("span");
        characterEl.className = "shrink-0 text-sm font-medium text-slate-800";
        characterEl.textContent = chip.characterName!;

        // separatorEl 名称分隔符
        const separatorEl = document.createElement("span");
        separatorEl.className = "shrink-0 text-slate-300";
        separatorEl.textContent = "·";

        // appearanceEl 形象名称
        const appearanceEl = document.createElement("span");
        appearanceEl.className = "truncate text-sm text-slate-500";
        appearanceEl.textContent = chip.appearanceName!;

        labelsWrap.appendChild(characterEl);
        labelsWrap.appendChild(separatorEl);
        labelsWrap.appendChild(appearanceEl);
        chipEl.appendChild(labelsWrap);
        chipEl.appendChild(createVoiceAudioIconElement(chip.hasVoiceAudio ?? false));
    } else {
        // labelEl 非角色资产展示文案
        const labelEl = document.createElement("span");
        labelEl.className = "truncate text-sm text-slate-800";
        labelEl.textContent = chip.label;
        chipEl.appendChild(labelEl);
    }

    return chipEl;
}

// CONTENT_TOKEN_PATTERN 内容中 inline 标签占位符
const CONTENT_TOKEN_PATTERN = /@(asset:\d+|duration:\d+)/g;

// 用 lucide Clapperboard 渲染时长标签图标
function createClapperboardIconElement() {
    // iconWrap 图标挂载容器
    const iconWrap = document.createElement("span");
    iconWrap.className =
        "inline-flex size-3.5 shrink-0 items-center justify-center text-slate-500";
    iconWrap.setAttribute("aria-hidden", "true");

    iconWrap.innerHTML = renderToStaticMarkup(
        createElement(Clapperboard, {
            className: "size-3.5",
            strokeWidth: 1.8,
        }),
    );

    return iconWrap;
}

// 创建 inline 时长标签 DOM
export function createDurationChipElement(seconds: number) {
    // chipEl 时长标签容器
    const chipEl = document.createElement("span");
    chipEl.className =
        "xyq-mention-chip inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-[#efeff4] px-2 py-0.5 align-middle text-sm font-medium leading-5 text-slate-700";
    chipEl.contentEditable = "false";
    chipEl.dataset.mention = "true";
    chipEl.dataset.durationSec = String(seconds);

    // labelEl 时长文案
    const labelEl = document.createElement("span");
    labelEl.dataset.durationLabel = "true";
    labelEl.textContent = `${seconds}s`;

    chipEl.appendChild(createClapperboardIconElement());
    chipEl.appendChild(labelEl);

    return chipEl;
}

// 更新已有 inline 时长标签的秒数
export function updateDurationChipElement(chipEl: HTMLElement, seconds: number) {
    chipEl.dataset.durationSec = String(seconds);

    const labelEl = chipEl.querySelector<HTMLElement>("[data-duration-label]");

    if (labelEl) {
        labelEl.textContent = `${seconds}s`;
    }
}

// 在 Range 处插入时长标签并移动光标
export function insertDurationChipAtRange(range: Range, seconds: number) {
    const selection = window.getSelection();
    range.deleteContents();

    const chipEl = createDurationChipElement(seconds);
    // trailingSpace 标签后空格，便于继续输入
    const trailingSpace = document.createTextNode(" ");

    range.insertNode(trailingSpace);
    range.insertNode(chipEl);

    if (!selection) {
        return;
    }

    const caretRange = document.createRange();
    caretRange.setStartAfter(trailingSpace);
    caretRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caretRange);
}

// 在 Range 处插入引用标签并移动光标
export function insertMentionChipAtRange(range: Range, chip: MentionChipData) {
    const selection = window.getSelection();
    range.deleteContents();

    const chipEl = createMentionChipElement(chip);
    // trailingSpace 标签后空格，便于继续输入
    const trailingSpace = document.createTextNode(" ");

    range.insertNode(trailingSpace);
    range.insertNode(chipEl);

    if (!selection) {
        return;
    }

    const caretRange = document.createRange();
    caretRange.setStartAfter(trailingSpace);
    caretRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caretRange);
}

// 将编辑器 DOM 序列化为可存储的 content 字符串
export function serializePromptEditorContent(root: HTMLElement) {
    let result = "";

    const walk = (node: Node, options?: { isBlockContainer?: boolean }) => {
        if (node.nodeType === Node.TEXT_NODE) {
            if (isInsideMentionChip(node)) {
                return;
            }

            result += node.textContent ?? "";
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        const element = node as HTMLElement;

        if (element.tagName === "BR") {
            result += "\n";
            return;
        }

        if (element.dataset.mention === "true" && element.dataset.durationSec) {
            result += `@duration:${element.dataset.durationSec}`;
            return;
        }

        if (element.dataset.mention === "true" && element.dataset.assetId) {
            result += `@asset:${element.dataset.assetId}`;
            return;
        }

        if (BLOCK_ELEMENT_TAGS.has(element.tagName) && element !== root) {
            if (result.length > 0 && !result.endsWith("\n")) {
                result += "\n";
            }

            element.childNodes.forEach((child) => walk(child));
            return;
        }

        element.childNodes.forEach((child) => walk(child, options));
    };

    root.childNodes.forEach((child) => walk(child));

    return result;
}

// 根据 content 字符串渲染编辑器 DOM（含引用标签）
export function renderPromptEditorContent(
    root: HTMLElement,
    content: string,
    resolveChip: (assetId: number) => MentionChipData | null,
) {
    root.replaceChildren();

    if (!content) {
        return;
    }

    let lastIndex = 0;

    for (const match of content.matchAll(CONTENT_TOKEN_PATTERN)) {
        const matchIndex = match.index ?? 0;
        const token = match[1];

        if (matchIndex > lastIndex) {
            appendTextWithLineBreaks(root, content.slice(lastIndex, matchIndex));
        }

        if (token.startsWith("duration:")) {
            const seconds = Number(token.slice("duration:".length));

            if (Number.isFinite(seconds) && seconds > 0) {
                root.appendChild(createDurationChipElement(seconds));
            } else {
                appendTextWithLineBreaks(root, match[0]);
            }
        } else if (token.startsWith("asset:")) {
            const assetId = Number(token.slice("asset:".length));
            const chipData = resolveChip(assetId);

            if (chipData) {
                root.appendChild(createMentionChipElement(chipData));
            } else {
                appendTextWithLineBreaks(root, match[0]);
            }
        } else {
            appendTextWithLineBreaks(root, match[0]);
        }

        lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < content.length) {
        appendTextWithLineBreaks(root, content.slice(lastIndex));
    }
}

// 从 selection 解析 @ 触发（仅当前文本节点内）
export function detectMentionTriggerFromSelection(root: HTMLElement) {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const anchorNode = selection.anchorNode;

    if (
        !anchorNode ||
        !root.contains(anchorNode) ||
        anchorNode.nodeType !== Node.TEXT_NODE ||
        isInsideMentionChip(anchorNode)
    ) {
        return null;
    }

    const textNode = anchorNode as Text;
    const textBefore = textNode.textContent?.slice(0, selection.anchorOffset) ?? "";
    const match = textBefore.match(/@([^\s@]*)$/);

    if (!match || match.index === undefined) {
        return null;
    }

    const triggerRange = document.createRange();
    triggerRange.setStart(textNode, match.index);
    triggerRange.setEnd(textNode, selection.anchorOffset);

    return {
        query: match[1],
        range: triggerRange,
    };
}
