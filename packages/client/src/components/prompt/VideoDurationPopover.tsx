// 视频时长选择弹层
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PromptPopoverPanel } from "@/components/prompt/PromptPopoverPanel";
import { type PromptPopoverInteractionProps } from "@/components/prompt/promptPopoverUtils";
import { Slider } from "@/components/ui/slider";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { VIDEO_DURATION_MAX, VIDEO_DURATION_MIN } from "@/lib/generationOptions";
import { cn } from "@/lib/utils";

// 渲染视频时长选择弹层
export function VideoDurationPopover({
    interactionScope = "default",
    popoverPlacement = "top",
}: PromptPopoverInteractionProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [duration, setDuration] = useState<number>(VIDEO_DURATION_MIN);

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
                {duration}s
                <ChevronDown className={cn("size-4 text-slate-400 transition", open ? "rotate-180" : "")} strokeWidth={1.8} />
            </button>

            <PromptPopoverPanel
                open={open}
                triggerRef={rootRef}
                panelRef={panelRef}
                interactionScope={interactionScope}
                popoverPlacement={popoverPlacement}
                widthClassName="w-[320px]"
            >
                <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">视频时长</p>
                    <div className="inline-flex h-8 min-w-[72px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                        {duration}
                        <span className="ml-0.5 text-slate-500">秒</span>
                    </div>
                </div>
                <Slider
                    min={VIDEO_DURATION_MIN}
                    max={VIDEO_DURATION_MAX}
                    step={1}
                    value={[duration]}
                    onValueChange={(values) => setDuration(values[0] ?? VIDEO_DURATION_MIN)}
                />
            </PromptPopoverPanel>
        </div>
    );
}
