// 清晰度与比例选择弹层（首页与画布共用）
import { useRef, useState } from "react";
import { Check, ChevronDown, Monitor, Ratio } from "lucide-react";
import { PromptPopoverPanel } from "@/components/prompt/PromptPopoverPanel";
import { type PromptPopoverInteractionProps } from "@/components/prompt/promptPopoverUtils";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import {
    formatOutputSettingsLabel,
    GENERATION_ASPECT_RATIO_OPTIONS,
    GENERATION_ASPECT_RATIO_SHAPES,
    GENERATION_RESOLUTION_OPTIONS,
    VIDEO_ASPECT_RATIO_OPTIONS,
    type GenerationAspectRatioId,
    type GenerationMediaType,
    type GenerationResolution,
    type VideoAspectRatioId,
} from "@/lib/generationOptions";
import { cn } from "@/lib/utils";

type OutputSettingsPopoverProps = PromptPopoverInteractionProps & {
    mediaType?: GenerationMediaType;
    defaultAspectRatio?: GenerationAspectRatioId | VideoAspectRatioId;
    defaultResolution?: GenerationResolution;
    labelMode?: "full" | "aspectOnly";
    aspectRatio?: GenerationAspectRatioId | VideoAspectRatioId;
    resolution?: GenerationResolution;
    onAspectRatioChange?: (value: GenerationAspectRatioId | VideoAspectRatioId) => void;
    onResolutionChange?: (value: GenerationResolution) => void;
};

// 渲染比例示意图标
function AspectRatioPreview({ ratioId }: { ratioId: GenerationAspectRatioId | VideoAspectRatioId }) {
    const shape = GENERATION_ASPECT_RATIO_SHAPES[ratioId];

    return (
        <span className="flex h-9 w-full items-center justify-center">
            <span
                className="rounded-[3px] border border-slate-300 bg-white"
                style={{ width: shape.width, height: shape.height }}
            />
        </span>
    );
}

// 渲染清晰度与比例选择弹层
export function OutputSettingsPopover({
    mediaType = "image",
    defaultAspectRatio = "9:16",
    defaultResolution = "3K",
    labelMode = "full",
    interactionScope = "default",
    popoverPlacement = "top",
    aspectRatio: controlledAspectRatio,
    resolution: controlledResolution,
    onAspectRatioChange,
    onResolutionChange,
}: OutputSettingsPopoverProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const isVideo = mediaType === "video";
    const [internalResolution, setInternalResolution] = useState<GenerationResolution>(
        defaultResolution as GenerationResolution,
    );
    const [internalAspectRatio, setInternalAspectRatio] = useState(defaultAspectRatio);
    const resolution = controlledResolution ?? internalResolution;
    const aspectRatio = controlledAspectRatio ?? internalAspectRatio;
    const aspectRatioOptions = isVideo ? VIDEO_ASPECT_RATIO_OPTIONS : GENERATION_ASPECT_RATIO_OPTIONS;
    const triggerLabel = isVideo
        ? aspectRatio
        : formatOutputSettingsLabel(aspectRatio as GenerationAspectRatioId, resolution, labelMode);

    usePopoverDismiss(rootRef, open, () => setOpen(false), [panelRef]);

    // 切换弹层开关
    const handleToggleOpen = () => {
        setOpen((current) => !current);
    };

    // 更新清晰度
    const handleResolutionChange = (nextResolution: GenerationResolution) => {
        if (controlledResolution === undefined) {
            setInternalResolution(nextResolution);
        }

        onResolutionChange?.(nextResolution);
    };

    // 更新比例
    const handleAspectRatioChange = (nextAspectRatio: GenerationAspectRatioId | VideoAspectRatioId) => {
        if (controlledAspectRatio === undefined) {
            setInternalAspectRatio(nextAspectRatio);
        }

        onAspectRatioChange?.(nextAspectRatio);
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
                <Ratio className="size-4 text-violet-500" strokeWidth={1.8} />
                {triggerLabel}
                <ChevronDown className={cn("size-4 text-slate-400 transition", open ? "rotate-180" : "")} strokeWidth={1.8} />
            </button>

            <PromptPopoverPanel
                open={open}
                triggerRef={rootRef}
                panelRef={panelRef}
                interactionScope={interactionScope}
                popoverPlacement={popoverPlacement}
            >
                {!isVideo ? (
                    <>
                        <p className="mb-2 text-sm font-medium text-slate-900">清晰度</p>
                        <div className="mb-4 grid grid-cols-2 gap-2">
                            {GENERATION_RESOLUTION_OPTIONS.map((option) => {
                                const selected = resolution === option;

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => handleResolutionChange(option)}
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
                    </>
                ) : null}

                <p className="mb-2 text-sm font-medium text-slate-900">比例</p>
                <div className={cn("grid gap-2", isVideo ? "grid-cols-4" : "grid-cols-4")}>
                    {aspectRatioOptions.map((option) => {
                        const selected = aspectRatio === option.id;

                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleAspectRatioChange(option.id)}
                                className={cn(
                                    "relative inline-flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-1 py-2 transition",
                                    selected
                                        ? "border-violet-400 bg-violet-50 text-violet-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                                )}
                            >
                                {selected ? (
                                    <Check
                                        className="absolute top-1.5 right-1.5 size-3 text-violet-500"
                                        strokeWidth={2.5}
                                    />
                                ) : null}
                                <AspectRatioPreview ratioId={option.id} />
                                <span className="text-xs">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            </PromptPopoverPanel>
        </div>
    );
}
