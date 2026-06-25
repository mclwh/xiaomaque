// 画布文本节点富文本编辑命令
export type TextBlockLevel = "p" | "h1" | "h2" | "h3";

export type TextFormatCommand = "bold" | "italic" | "underline" | "strikeThrough";

// 在可编辑区域内执行 document 命令
export function execCanvasTextCommand(command: string, value?: string) {
    document.execCommand(command, false, value);
}

// 设置文本块级标题
export function applyTextBlockLevel(level: TextBlockLevel) {
    const blockTag = level === "p" ? "p" : level;
    execCanvasTextCommand("formatBlock", blockTag);
}

// 切换文本行内格式
export function toggleTextFormat(format: TextFormatCommand) {
    execCanvasTextCommand(format);
}

// 画布文本预设颜色
export const CANVAS_TEXT_PRESET_COLORS = [
    "#0f172a",
    "#64748b",
    "#3b82f6",
    "#2563eb",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#14b8a6",
    "#8b5cf6",
    "#ec4899",
    "#ffffff",
] as const;

// 工具栏色块默认展示色
export const CANVAS_TEXT_DEFAULT_COLOR = "#3b82f6";

// 正文默认文字颜色
export const CANVAS_TEXT_FALLBACK_COLOR = "#0f172a";

// 将 RGB 字符串转为 HEX
function rgbStringToHex(rgb: string) {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) {
        return null;
    }

    const [, red, green, blue] = match;

    return `#${[red, green, blue]
        .map((value) => Number(value).toString(16).padStart(2, "0"))
        .join("")}`;
}

// 规范化 queryCommandValue 返回的颜色值
export function normalizeTextColor(value: string) {
    const trimmed = value.trim().toLowerCase();

    if (!trimmed) {
        return CANVAS_TEXT_FALLBACK_COLOR;
    }

    if (trimmed.startsWith("#")) {
        return trimmed.length === 4
            ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
            : trimmed;
    }

    const hex = rgbStringToHex(trimmed);
    if (hex) {
        return hex;
    }

    return CANVAS_TEXT_FALLBACK_COLOR;
}

// 设置选区文字颜色
export function applyTextColor(color: string) {
    execCanvasTextCommand("foreColor", normalizeTextColor(color));
}

// 查询当前选区文字颜色
export function queryTextColor() {
    try {
        const value = document.queryCommandValue("foreColor");
        if (!value) {
            return CANVAS_TEXT_FALLBACK_COLOR;
        }

        return normalizeTextColor(value);
    } catch {
        return CANVAS_TEXT_FALLBACK_COLOR;
    }
}

// 清除选区格式并恢复为正文段落
export function clearTextFormatting() {
    execCanvasTextCommand("removeFormat");
    execCanvasTextCommand("unlink");
    applyTextBlockLevel("p");
}

// 查询当前选区是否处于某种格式
export function queryTextFormatState(format: TextFormatCommand) {
    try {
        return document.queryCommandState(format);
    } catch {
        return false;
    }
}

// 查询当前选区块级标签
export function queryTextBlockLevel(): TextBlockLevel {
    try {
        const value = document.queryCommandValue("formatBlock").toLowerCase();

        if (value.includes("h1")) {
            return "h1";
        }

        if (value.includes("h2")) {
            return "h2";
        }

        if (value.includes("h3")) {
            return "h3";
        }
    } catch {
        return "p";
    }

    return "p";
}

// 获取编辑器 HTML 内容
export function readEditorHtml(editor: HTMLElement | null) {
    return editor?.innerHTML ?? "";
}

// 写入编辑器 HTML 内容
export function writeEditorHtml(editor: HTMLElement | null, html: string) {
    if (editor) {
        editor.innerHTML = html;
    }
}
