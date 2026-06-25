// 视频分辨率选择弹层
import { useRef, useState } from "react";
import { ChevronDown, Monitor } from "lucide-react";
import { PromptPopoverPanel } from "@/components/prompt/PromptPopoverPanel";
import { type PromptPopoverInteractionProps } from "@/components/prompt/promptPopoverUtils";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { VIDEO_RESOLUTION_OPTIONS, type VideoResolution } from "@/lib/generationOptions";
import { cn } from "@/lib/utils";

type VideoResolutionPopoverProps = PromptPopoverInteractionProps & {
    value?: VideoResolution;
    onValueChange?: (value: VideoResolution) => void;
};

// 渲染视频分辨率选择弹层
export function VideoResolutionPopover({
    interactionScope = "default",
    popoverPlacement = "top",
    value,
    onValueChange,
}: VideoResolutionPopoverProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [resolution, setResolution] = useState<VideoResolution>("480p");
    const selectedResolution = value ?? resolution;

    usePopoverDismiss(rootRef, open, () => setOpen(false), [panelRef]);

    // 切换弹层开关
    const handleToggleOpen = () => {
        setOpen((current) => !current);
    };

    // 选中分辨率并关闭弹层
    const handleSelectResolution = (nextResolution: VideoResolution) => {
        if (value === undefined) {
            setResolution(nextResolution);
        }

        onValueChange?.(nextResolution);
        setOpen(false);
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
                <Monitor className="size-4 text-violet-500" strokeWidth={1.8} />
                {selectedResolution}
                <ChevronDown className={cn("size-4 text-slate-400 transition", open ? "rotate-180" : "")} strokeWidth={1.8} />
            </button>

            <PromptPopoverPanel
                open={open}
                triggerRef={rootRef}
                panelRef={panelRef}
                interactionScope={interactionScope}
                popoverPlacement={popoverPlacement}
                widthClassName="w-[240px]"
            >
                <p className="mb-2 text-sm font-medium text-slate-900">分辨率</p>
                <div className="grid grid-cols-2 gap-2">
                    {VIDEO_RESOLUTION_OPTIONS.map((option) => {
                        const selected = selectedResolution === option;

                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() => handleSelectResolution(option)}
                                className={cn(
                                    "inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium transition",
                                    selected
                                        ? "border-violet-400 bg-violet-50 text-violet-700"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                                )}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </PromptPopoverPanel>
        </div>
    );
}
