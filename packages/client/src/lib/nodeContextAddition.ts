// 添加上下文：各类型节点可接入的上下文类型配置
import type { CanvasNodeKind, CanvasNodeOption } from "@/components/canvas/canvasTypes";
import { CANVAS_NODE_OPTIONS } from "@/components/canvas/canvasTypes";

/*
 * NODE_CONTEXT_ADDITION_TARGETS 各目标节点可添加上下文的类型（顺序即菜单展示顺序）
 */
export const NODE_CONTEXT_ADDITION_TARGETS: Record<CanvasNodeKind, CanvasNodeKind[]> = {
    character: ["text", "image", "character"],
    scene: ["text", "image", "scene"],
    text: ["text"],
    audio: ["text"],
    video: ["text", "image", "video", "audio", "character", "scene"],
    image: ["text", "image", "character", "scene"],
};

// 获取当前节点可添加上下文的菜单选项
export function getNodeContextAdditionOptions(targetKind: CanvasNodeKind): CanvasNodeOption[] {
    const contextIds = NODE_CONTEXT_ADDITION_TARGETS[targetKind];

    return CANVAS_NODE_OPTIONS.filter((option) => contextIds.includes(option.id));
}
