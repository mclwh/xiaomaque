// 选中节点时挂载的 NodeToolbar 区域（upload bar + 编辑面板）
import { memo } from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import { CANVAS_NODE_PANEL_GAP } from "@/components/canvas/canvasNodeConfig";
import { CanvasNodeEditorPanel } from "@/components/canvas/CanvasNodeEditorPanel";
import { CanvasNodeUploadBar } from "@/components/canvas/nodes/CanvasNodeUploadBar";
import { CanvasAudioNodeToolbar } from "@/components/canvas/nodes/CanvasAudioNodeToolbar";
import { selectShowNodeEditorPanel } from "@/store/canvasSlice";
import { useAppSelector } from "@/store/hooks";

type CanvasAssetNodeToolbarsProps = {
    nodeId: string;
    assetId: number;
    kind: CanvasNodeKind;
    showUploadBar: boolean;
    isTextNode: boolean;
    mediaUrl?: string | null;
};

// 渲染选中节点的 upload bar 与编辑面板 NodeToolbar
function CanvasAssetNodeToolbarsComponent({
    nodeId,
    assetId,
    kind,
    showUploadBar,
    isTextNode,
    mediaUrl,
}: CanvasAssetNodeToolbarsProps) {
    const showNodeEditorPanel = useAppSelector(selectShowNodeEditorPanel);
    const showAudioToolbar = kind === "audio" && Boolean(mediaUrl);

    return (
        <>
            {showAudioToolbar ? (
                <NodeToolbar nodeId={nodeId} position={Position.Top} align="center" offset={10}>
                    <CanvasAudioNodeToolbar assetId={assetId} mediaUrl={mediaUrl!} />
                </NodeToolbar>
            ) : showUploadBar ? (
                <NodeToolbar nodeId={nodeId} position={Position.Top} align="center" offset={10}>
                    <CanvasNodeUploadBar assetId={assetId} kind={kind} />
                </NodeToolbar>
            ) : null}

            {!isTextNode && showNodeEditorPanel ? (
                <NodeToolbar
                    nodeId={nodeId}
                    position={Position.Bottom}
                    align="center"
                    offset={CANVAS_NODE_PANEL_GAP}
                >
                    <CanvasNodeEditorPanel assetId={assetId} kind={kind} />
                </NodeToolbar>
            ) : null}
        </>
    );
}

export const CanvasAssetNodeToolbars = memo(CanvasAssetNodeToolbarsComponent);
