// 可编辑区 @ 引用触发与插入工具

// MentionCaretRect 光标锚点矩形
export type MentionCaretRect = {
    top: number;
    left: number;
    bottom: number;
};

// MentionTrigger 当前 @ 触发状态
export type MentionTrigger = {
    query: string;
    startOffset: number;
    caretRect: MentionCaretRect;
};

// 计算光标在纯文本中的字符偏移
export function getTextOffsetInEditor(root: HTMLElement, targetNode: Node, targetOffset: number) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let offset = 0;

    while (walker.nextNode()) {
        const textNode = walker.currentNode;

        if (textNode === targetNode) {
            return offset + targetOffset;
        }

        offset += textNode.textContent?.length ?? 0;
    }

    return offset;
}

// 根据字符偏移设置光标位置
export function setCaretAtTextOffset(root: HTMLElement, targetOffset: number) {
    const selection = window.getSelection();

    if (!selection) {
        return;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let offset = 0;

    while (walker.nextNode()) {
        const textNode = walker.currentNode;
        const textLength = textNode.textContent?.length ?? 0;
        const nextOffset = offset + textLength;

        if (targetOffset <= nextOffset) {
            const range = document.createRange();
            range.setStart(textNode, Math.max(0, targetOffset - offset));
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }

        offset = nextOffset;
    }

    const range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

// 获取光标前的纯文本
export function getTextBeforeCaret(root: HTMLElement) {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) {
        return "";
    }

    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(root);
    preRange.setEnd(range.endContainer, range.endOffset);

    return preRange.toString();
}

// 获取光标在编辑器中的字符偏移
export function getCaretTextOffset(root: HTMLElement) {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || !selection.anchorNode) {
        return root.textContent?.length ?? 0;
    }

    return getTextOffsetInEditor(root, selection.anchorNode, selection.anchorOffset);
}

// 获取光标处的屏幕坐标
export function getCaretClientRect(root: HTMLElement): MentionCaretRect | null {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const range = selection.getRangeAt(0).cloneRange();
    range.collapse(true);

    const rects = range.getClientRects();

    if (rects.length > 0) {
        const rect = rects[rects.length - 1];

        return {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
        };
    }

    const marker = document.createElement("span");
    marker.textContent = "\u200b";
    range.insertNode(marker);
    const rect = marker.getBoundingClientRect();
    marker.remove();

    if (rect.width === 0 && rect.height === 0) {
        return null;
    }

    return {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
    };
}

// 解析光标前文本中的 @ 触发
export function detectMentionTrigger(textBeforeCaret: string): Omit<MentionTrigger, "caretRect"> | null {
    const match = textBeforeCaret.match(/@([^\s@]*)$/);

    if (!match || match.index === undefined) {
        return null;
    }

    return {
        query: match[1],
        startOffset: match.index,
    };
}

// 在编辑器中插入 @ 引用文本并移动光标
export function insertMentionAtTrigger(
    root: HTMLElement,
    triggerStartOffset: number,
    mentionLabel: string,
) {
    const fullText = root.textContent ?? "";
    const caretOffset = getCaretTextOffset(root);
    const insertText = `@${mentionLabel}`;
    const nextText =
        fullText.slice(0, triggerStartOffset) + insertText + " " + fullText.slice(caretOffset);

    root.textContent = nextText;
    setCaretAtTextOffset(root, triggerStartOffset + insertText.length + 1);
}
