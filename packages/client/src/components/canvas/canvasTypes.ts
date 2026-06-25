// 画布默认节点选择器类型定义
import type { LucideIcon } from "lucide-react";
import {
    AudioLines,
    Image as ImageIcon,
    Landmark,
    PlaySquare,
    Text,
    UserRound,
} from "lucide-react";

export type CanvasNodeKind = "character" | "scene" | "video" | "image" | "text" | "audio";

export type CanvasNodeOption = {
    id: CanvasNodeKind;
    label: string;
    icon: LucideIcon;
    description?: string;
};

/*
 * ADD_NODE_OPTIONS 添加节点面板选项（顺序与设计稿一致）
 */
export const ADD_NODE_OPTIONS: CanvasNodeOption[] = [
    {
        id: "character",
        label: "角色",
        icon: UserRound,
    },
    { id: "scene", label: "场景", icon: Landmark },
    { id: "text", label: "文本", icon: Text },
    { id: "image", label: "图片", icon: ImageIcon },
    { id: "video", label: "视频", icon: PlaySquare },
    { id: "audio", label: "音频", icon: AudioLines },
];

/*
 * CANVAS_NODE_OPTIONS 空画布居中快速新建选项
 */
export const CANVAS_NODE_OPTIONS: CanvasNodeOption[] = [
    {
        id: "character",
        label: "角色",
        icon: UserRound,
    },
    { id: "scene", label: "场景", icon: Landmark },
    { id: "video", label: "视频", icon: PlaySquare },
    { id: "image", label: "图片", icon: ImageIcon },
    { id: "text", label: "文本", icon: Text },
    { id: "audio", label: "音频", icon: AudioLines },
];

// CANVAS_NODE_OPTION_BY_KIND 节点类型选项索引（O(1) 查找）
export const CANVAS_NODE_OPTION_BY_KIND = Object.fromEntries(
    CANVAS_NODE_OPTIONS.map((option) => [option.id, option]),
) as Record<CanvasNodeKind, CanvasNodeOption>;
