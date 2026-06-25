// 画布节点 UI 配置：各类型尺寸与展示文案
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";

// CanvasNodeUiConfig 单类节点的 UI 配置
export type CanvasNodeUiConfig = {
    cardWidth: number;
    cardMinHeight: number;
    placeholderAspect: string;
    showFooter: boolean;
    footerTitle: string;
    showEpisode: boolean;
    showUploadBar: boolean;
    placeholderText: string;
};

// CANVAS_NODE_UI 各节点类型 UI 配置表
export const CANVAS_NODE_UI: Record<CanvasNodeKind, CanvasNodeUiConfig> = {
    character: {
        cardWidth: 200,
        cardMinHeight: 280,
        placeholderAspect: "aspect-[4/5]",
        showFooter: true,
        footerTitle: "基础形象",
        showEpisode: true,
        showUploadBar: true,
        placeholderText: "",
    },
    scene: {
        cardWidth: 200,
        cardMinHeight: 280,
        placeholderAspect: "aspect-[4/5]",
        showFooter: true,
        footerTitle: "未命名场景",
        showEpisode: true,
        showUploadBar: true,
        placeholderText: "",
    },
    text: {
        cardWidth: 280,
        cardMinHeight: 120,
        placeholderAspect: "aspect-auto min-h-[88px]",
        showFooter: false,
        footerTitle: "",
        showEpisode: false,
        showUploadBar: false,
        placeholderText: "文本",
    },
    image: {
        cardWidth: 160,
        cardMinHeight: 240,
        placeholderAspect: "aspect-[9/16] min-h-[200px]",
        showFooter: false,
        footerTitle: "",
        showEpisode: false,
        showUploadBar: true,
        placeholderText: "",
    },
    video: {
        cardWidth: 160,
        cardMinHeight: 240,
        placeholderAspect: "aspect-[9/16] min-h-[200px]",
        showFooter: false,
        footerTitle: "",
        showEpisode: false,
        showUploadBar: false,
        placeholderText: "",
    },
    audio: {
        cardWidth: 200,
        cardMinHeight: 88,
        placeholderAspect: "aspect-[5/2]",
        showFooter: false,
        footerTitle: "",
        showEpisode: false,
        showUploadBar: false,
        placeholderText: "",
    },
};

// CANVAS_NODE_HEADER_HEIGHT 节点顶栏（图标 + 标题）占用高度
export const CANVAS_NODE_HEADER_HEIGHT = 28;

// CANVAS_NODE_HEADER_MARGIN 节点标题与卡片之间的间距（mb-2）
export const CANVAS_NODE_HEADER_MARGIN = 8;

// PANEL_GAP 编辑面板与节点底部的间距
export const CANVAS_NODE_PANEL_GAP = 16;

// CANVAS_NODE_EDITOR_PANEL_WIDTH 编辑面板宽度
export const CANVAS_NODE_EDITOR_PANEL_WIDTH = 800;

// CANVAS_NODE_EDITOR_PANEL_HEIGHT 编辑面板高度
export const CANVAS_NODE_EDITOR_PANEL_HEIGHT = 236;

// 获取节点在画布中的宽高（用于定位悬浮面板）
export function getCanvasNodeDimensions(kind: CanvasNodeKind) {
    const config = CANVAS_NODE_UI[kind];

    return {
        width: config.cardWidth,
        height: CANVAS_NODE_HEADER_HEIGHT + config.cardMinHeight,
    };
}

// 获取节点顶栏展示名称
export function getCanvasNodeHeaderLabel(
    kind: CanvasNodeKind,
    label: string,
    characterName?: string | null,
) {
    if (kind === "character") {
        const trimmedCharacterName = characterName?.trim();
        const trimmedLabel = label.trim();

        if (trimmedCharacterName) {
            return trimmedCharacterName;
        }

        if (trimmedLabel && trimmedLabel !== "角色") {
            return trimmedLabel;
        }

        return "未命名角色";
    }

    if (kind === "scene" || label === "场景") {
        return "未命名场景";
    }

    return label;
}
