// 空画布居中展示的默认节点选择器（悬浮时展示副标题）
import { MousePointer2 } from "lucide-react";
import { CANVAS_NODE_OPTIONS, type CanvasNodeKind } from "@/components/canvas/canvasTypes";

type CanvasNodeSelectorProps = {
    onSelect: (kind: CanvasNodeKind) => void;
};

// 渲染快速新建节点类型选择器
export function CanvasNodeSelector({ onSelect }: CanvasNodeSelectorProps) {
    return (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="pointer-events-auto flex flex-col items-center gap-4">
                <div className="flex w-[min(1326px,calc(100vw-48px))] flex-nowrap items-center justify-center gap-3">
                    {CANVAS_NODE_OPTIONS.map((option) => {
                        const Icon = option.icon;

                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => onSelect(option.id)}
                                className="group flex h-16 max-h-16 min-w-0 max-w-[211px] flex-1 basis-[211px] items-center justify-center gap-2 rounded-xl border border-black/5 bg-white px-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                            >
                                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f0f0f2] text-slate-700 transition">
                                    <Icon className="size-4" strokeWidth={1.8} />
                                </span>
                                <span className="min-w-0 text-sm font-medium text-slate-900">
                                    <span className="block truncate">{option.label}</span>
                                    {option.description ? (
                                        <span className="hidden text-xs font-normal text-slate-400 group-hover:inline">
                                            {option.description}
                                        </span>
                                    ) : null}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <p className="flex items-center gap-1.5 text-sm text-slate-400">
                    <MousePointer2 className="size-4" strokeWidth={1.8} />
                    点击快速新建
                </p>
            </div>
        </div>
    );
}
