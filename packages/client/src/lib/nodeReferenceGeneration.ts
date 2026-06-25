// 引用节点生成：各类型节点可生成的目标类型配置
import type { CanvasNodeKind, CanvasNodeOption } from "@/components/canvas/canvasTypes";
import { CANVAS_NODE_OPTIONS } from "@/components/canvas/canvasTypes";

/*
 * NODE_REFERENCE_GENERATION_TARGETS 各源节点可引用生成的目标类型（顺序即菜单展示顺序）
 */
export const NODE_REFERENCE_GENERATION_TARGETS: Record<CanvasNodeKind, CanvasNodeKind[]> = {
    character: ["character", "video", "image"],
    scene: ["scene", "video", "image"],
    video: ["video"],
    image: ["character", "scene", "video", "image"],
    audio: ["video"],
    text: ["character", "scene", "text", "image", "video", "audio"],
};

// 获取当前节点可引用生成的菜单选项（顺序与 NODE_REFERENCE_GENERATION_TARGETS 一致）
export function getNodeReferenceGenerationOptions(sourceKind: CanvasNodeKind): CanvasNodeOption[] {
    const optionById = Object.fromEntries(CANVAS_NODE_OPTIONS.map((option) => [option.id, option]));
    const targetIds = NODE_REFERENCE_GENERATION_TARGETS[sourceKind];

    return targetIds
        .map((targetId) => optionById[targetId])
        .filter((option): option is CanvasNodeOption => Boolean(option));
}
