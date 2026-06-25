// 左侧工具栏展开的「添加节点」垂直菜单
import { ADD_NODE_OPTIONS, type CanvasNodeKind } from "@/components/canvas/canvasTypes";

type CanvasAddNodePanelProps = {
    onSelect: (kind: CanvasNodeKind) => void;
};

// 渲染添加节点垂直面板
export function CanvasAddNodePanel({ onSelect }: CanvasAddNodePanelProps) {
    return (
        <div className="pointer-events-auto w-[280px] rounded-2xl border border-black/5 bg-white p-3 shadow-md">
            <p className="px-2 pb-2 text-xs text-slate-400">添加节点</p>

            <ul className="flex flex-col gap-0.5">
                {ADD_NODE_OPTIONS.map((option) => {
                    const Icon = option.icon;

                    return (
                        <li key={option.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(option.id)}
                                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#f3f4f6]"
                            >
                                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f0f0f2] text-slate-700 transition group-hover:bg-white">
                                    <Icon className="size-[18px]" strokeWidth={1.8} />
                                </span>

                                <span className="min-w-0">
                                    <span className="text-sm font-medium text-slate-900">{option.label}</span>
                                    {option.description ? (
                                        <span className="ml-2 hidden text-xs text-slate-400 group-hover:inline">
                                            {option.description}
                                        </span>
                                    ) : null}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
