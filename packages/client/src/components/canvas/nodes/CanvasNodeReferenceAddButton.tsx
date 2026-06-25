// 节点右侧「引用该节点生成」添加按钮与弹层
import { memo, useCallback, useRef, useState, type MouseEvent } from "react";
import { Plus } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import { useCanvasNodeActions } from "@/components/canvas/CanvasNodeActionsContext";
import { handlePromptPopoverMouseDown } from "@/components/prompt/promptPopoverUtils";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { getNodeReferenceGenerationOptions } from "@/lib/nodeReferenceGeneration";
import { cn } from "@/lib/utils";

type CanvasNodeReferenceAddButtonProps = {
    sourceNodeId: string;
    sourceKind: CanvasNodeKind;
    selected?: boolean;
};

// 渲染节点右侧引用生成按钮与目标类型菜单
function CanvasNodeReferenceAddButtonComponent({
    sourceNodeId,
    sourceKind,
    selected = false,
}: CanvasNodeReferenceAddButtonProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const { assetCreating, createReferencedAsset } = useCanvasNodeActions();
    const [open, setOpen] = useState(false);
    const menuOptions = getNodeReferenceGenerationOptions(sourceKind);

    usePopoverDismiss(rootRef, open, () => setOpen(false));

    // 切换引用生成菜单开关
    const handleToggleOpen = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        setOpen((current) => !current);
    };

    // 阻止画布拖拽并避免 Handle 抢占点击
    const handleButtonMouseDown = (event: MouseEvent) => {
        event.stopPropagation();
        handlePromptPopoverMouseDown(event, "canvas");
    };

    // 选择目标类型并创建引用节点
    const handleSelectTarget = useCallback(
        (targetKind: CanvasNodeKind) => {
            if (assetCreating) {
                return;
            }

            setOpen(false);
            createReferencedAsset({ type: targetKind, sourceNodeId });
        },
        [assetCreating, createReferencedAsset, sourceNodeId],
    );

    return (
        <div
            ref={rootRef}
            className={cn(
                "absolute -right-10 top-1/2 z-10 -translate-y-1/2 transition-opacity duration-200",
                open || selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
        >
            <div className="relative size-8">
                <Handle
                    id="reference-source"
                    type="source"
                    position={Position.Right}
                    className="nodrag nopan pointer-events-none !absolute !left-1/2 !top-1/2 !size-2 !-translate-x-1/2 !-translate-y-1/2 !transform-none !rounded-full !border-0 !bg-transparent !opacity-0"
                />
                <button
                    type="button"
                    aria-label="引用该节点生成"
                    aria-expanded={open}
                    aria-haspopup="menu"
                    className={cn(
                        "nodrag nopan relative z-10 flex size-8 cursor-pointer items-center justify-center rounded-full border shadow-md transition-colors",
                        open
                            ? "border-transparent bg-violet-600 text-white"
                            : "border-black/5 bg-white text-slate-900 hover:bg-slate-50",
                    )}
                    onClick={handleToggleOpen}
                    onMouseDown={handleButtonMouseDown}
                >
                    <Plus className="size-4" strokeWidth={2.2} />
                </button>
            </div>

            {open ? (
                <div
                    role="menu"
                    className="nodrag nopan absolute left-full top-1/2 z-50 ml-2 w-[168px] -translate-y-1/2 overflow-hidden rounded-xl border border-black/5 bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
                    onMouseDown={(event) => handlePromptPopoverMouseDown(event, "canvas")}
                >
                    <p className="px-3 pb-1 pt-2.5 text-xs text-slate-400">引用该节点生成</p>
                    {menuOptions.map((option) => {
                        const Icon = option.icon;

                        return (
                            <button
                                key={option.id}
                                type="button"
                                role="menuitem"
                                disabled={assetCreating}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    handleSelectTarget(option.id);
                                }}
                            >
                                <Icon className="size-4 shrink-0 text-slate-500" strokeWidth={1.8} />
                                <span>{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

export const CanvasNodeReferenceAddButton = memo(CanvasNodeReferenceAddButtonComponent);
