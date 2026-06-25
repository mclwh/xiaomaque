// 画布资产自定义节点
import { memo } from "react";
import { type Node, type NodeProps } from "@xyflow/react";
import { CANVAS_NODE_OPTION_BY_KIND } from "@/components/canvas/canvasTypes";
import {
    CANVAS_NODE_UI,
    getCanvasNodeHeaderLabel,
} from "@/components/canvas/canvasNodeConfig";
import { CanvasAssetNodeToolbars } from "@/components/canvas/CanvasAssetNodeToolbars";
import { CanvasNodeContextAddButton } from "@/components/canvas/nodes/CanvasNodeContextAddButton";
import { CanvasNodeReferenceAddButton } from "@/components/canvas/nodes/CanvasNodeReferenceAddButton";
import { CanvasNodeBody } from "@/components/canvas/nodes/CanvasNodeBody";
import { CanvasTextNodeEditor } from "@/components/canvas/nodes/CanvasTextNodeEditor";
import type { CanvasAssetNodeData } from "@/store/types/canvas";
import { selectIsAssetGenerating } from "@/store/canvasSlice";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

// 渲染单个画布资产节点
function CanvasAssetNodeComponent({ id, data, selected }: NodeProps<Node<CanvasAssetNodeData>>) {
    const option = CANVAS_NODE_OPTION_BY_KIND[data.kind];
    const Icon = option.icon;
    const config = CANVAS_NODE_UI[data.kind];
    const headerLabel =
        data.kind === "character"
            ? option.label
            : getCanvasNodeHeaderLabel(data.kind, data.label, data.characterName);
    const isTextNode = data.kind === "text";
    const isGenerating = useAppSelector(selectIsAssetGenerating(data.assetId));

    return (
        <div className="group relative">
            {selected ? (
                <CanvasAssetNodeToolbars
                    nodeId={id}
                    assetId={data.assetId}
                    kind={data.kind}
                    showUploadBar={config.showUploadBar}
                    isTextNode={isTextNode}
                    mediaUrl={data.mediaUrl}
                />
            ) : null}

            <div className="mb-2 flex items-center gap-1.5 px-0.5">
                <Icon className="size-3.5 text-slate-400" strokeWidth={1.8} />
                <span className="text-xs text-slate-400">{headerLabel}</span>
            </div>

            <div className="relative">
                <CanvasNodeContextAddButton targetNodeId={id} targetKind={data.kind} selected={selected} />
                <CanvasNodeReferenceAddButton sourceNodeId={id} sourceKind={data.kind} selected={selected} />

                <div
                    className={cn(
                        "relative transition-shadow duration-200",
                        selected ? "rounded-[22px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]" : "",
                    )}
                >
                    {isTextNode ? (
                        <CanvasTextNodeEditor
                            nodeId={id}
                            selected={selected}
                            textContent={data.textContent ?? ""}
                        />
                    ) : (
                        <CanvasNodeBody
                            assetId={data.assetId}
                            kind={data.kind}
                            label={headerLabel}
                            mediaUrl={data.mediaUrl}
                            isGenerating={isGenerating}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export const CanvasAssetNode = memo(CanvasAssetNodeComponent);
