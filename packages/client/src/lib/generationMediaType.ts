// 将画布节点类型映射为生成媒体类型
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import type { GenerationMediaType } from "@/lib/generationOptions";

// 根据画布节点类型返回生成媒体类型
export function getGenerationMediaTypeFromNodeKind(nodeKind: CanvasNodeKind): GenerationMediaType {
    if (nodeKind === "video") {
        return "video";
    }

    return "image";
}

// 判断画布节点是否支持 Seedream 生图
export function canGenerateImageOnCanvas(nodeKind: CanvasNodeKind): boolean {
    return nodeKind !== "text" && nodeKind !== "audio" && nodeKind !== "video";
}

// 判断是否为音频节点
export function isAudioCanvasNode(nodeKind: CanvasNodeKind): boolean {
    return nodeKind === "audio";
}
