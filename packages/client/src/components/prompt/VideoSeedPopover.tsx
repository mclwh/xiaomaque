// 视频 Seed 设置弹层
import { useRef, useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";
import { PromptPopoverPanel } from "@/components/prompt/PromptPopoverPanel";
import { type PromptPopoverInteractionProps } from "@/components/prompt/promptPopoverUtils";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import type { VideoSeedMode } from "@/lib/generationOptions";
import { cn } from "@/lib/utils";

// 渲染视频 Seed 设置弹层
export function VideoSeedPopover({
    interactionScope = "default",
    popoverPlacement = "top",
}: PromptPopoverInteractionProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [seedMode, setSeedMode] = useState<VideoSeedMode>("random");
    const [seedValue, setSeedValue] = useState("");

    usePopoverDismiss(rootRef, open, () => setOpen(false), [panelRef]);

    // 切换弹层开关
    const handleToggleOpen = () => {
        setOpen((current) => !current);
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={handleToggleOpen}
                className={cn(
                    "inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-3 text-sm transition",
                    open ? "bg-violet-50 text-violet-700" : "text-slate-700 hover:bg-slate-100",
                )}
            >
                Seed
                <ChevronDown className={cn("size-4 text-slate-400 transition", open ? "rotate-180" : "")} strokeWidth={1.8} />
            </button>

            <PromptPopoverPanel
                open={open}
                triggerRef={rootRef}
                panelRef={panelRef}
                interactionScope={interactionScope}
                popoverPlacement={popoverPlacement}
                widthClassName="w-[360px]"
            >
                <div className="mb-3 flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-900">Seed</span>
                    <CircleHelp className="size-3.5 text-slate-400" strokeWidth={1.8} />
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                        <input
                            type="number"
                            value={seedValue}
                            placeholder="可选"
                            disabled={seedMode === "random"}
                            onChange={(event) => setSeedValue(event.target.value)}
                            className={cn(
                                "h-10 w-full rounded-xl border bg-white px-3 pr-8 text-sm text-slate-900 outline-none placeholder:text-slate-400",
                                seedMode === "fixed"
                                    ? "border-violet-400"
                                    : "border-slate-200 disabled:bg-slate-50 disabled:text-slate-400",
                            )}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setSeedMode("random")}
                        className={cn(
                            "inline-flex h-10 shrink-0 cursor-pointer items-center rounded-xl border px-4 text-sm transition",
                            seedMode === "random"
                                ? "border-violet-400 bg-white text-slate-900"
                                : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/80",
                        )}
                    >
                        随机
                    </button>
                    <button
                        type="button"
                        onClick={() => setSeedMode("fixed")}
                        className={cn(
                            "inline-flex h-10 shrink-0 cursor-pointer items-center rounded-xl border px-4 text-sm transition",
                            seedMode === "fixed"
                                ? "border-violet-400 bg-white text-slate-900"
                                : "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/80",
                        )}
                    >
                        固定
                    </button>
                </div>
            </PromptPopoverPanel>
        </div>
    );
}
