// 画布左侧垂直居中工具栏与添加节点面板
import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { CanvasAddNodeIcon } from "@/components/canvas/CanvasAddNodeIcon";
import { CanvasAddNodePanel } from "@/components/canvas/CanvasAddNodePanel";
import { CanvasAssetFolderPanel } from "@/components/canvas/CanvasAssetFolderPanel";
import { CanvasToolbarTooltip } from "@/components/canvas/CanvasToolbarTooltip";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import { cn } from "@/lib/utils";

type CanvasLeftToolbarProps = {
    onSelectNode: (kind: CanvasNodeKind) => void;
};

// 渲染画布左侧浮动工具栏
export function CanvasLeftToolbar({ onSelectNode }: CanvasLeftToolbarProps) {
    // panelOpen 添加节点面板是否展开
    const [panelOpen, setPanelOpen] = useState(false);
    // folderOpen 资产文件夹面板是否展开
    const [folderOpen, setFolderOpen] = useState(false);

    // 选中节点类型后关闭悬浮面板
    const handleSelectNode = (kind: CanvasNodeKind) => {
        onSelectNode(kind);
        setPanelOpen(false);
    };

    // 切换资产文件夹面板
    const handleToggleFolder = () => {
        setFolderOpen((current) => !current);
    };

    return (
        <div className="pointer-events-none absolute top-1/2 left-5 z-30 -translate-y-1/2">
            <div className="relative">
                <div className="pointer-events-auto flex flex-col items-center gap-2 rounded-full border border-black/5 bg-white/95 p-2 shadow-sm backdrop-blur">
                    <div
                        className="relative"
                        onMouseEnter={() => setPanelOpen(true)}
                        onMouseLeave={() => setPanelOpen(false)}
                    >
                        <button
                            type="button"
                            aria-label={panelOpen ? "关闭添加节点" : "添加节点"}
                            aria-expanded={panelOpen}
                            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
                        >
                            <CanvasAddNodeIcon active={panelOpen} />
                        </button>

                        {panelOpen ? (
                            <div className="absolute top-0 left-full pl-3">
                                <CanvasAddNodePanel onSelect={handleSelectNode} />
                            </div>
                        ) : null}
                    </div>

                    <CanvasToolbarTooltip label="资产文件夹" side="right">
                        <button
                            type="button"
                            aria-label="资产文件夹"
                            aria-expanded={folderOpen}
                            className={cn(
                                "inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100",
                                folderOpen && "bg-slate-100",
                            )}
                            onClick={handleToggleFolder}
                        >
                            <FolderOpen className="size-5" strokeWidth={1.8} />
                        </button>
                    </CanvasToolbarTooltip>
                </div>

                <CanvasAssetFolderPanel open={folderOpen} onClose={() => setFolderOpen(false)} />
            </div>
        </div>
    );
}
