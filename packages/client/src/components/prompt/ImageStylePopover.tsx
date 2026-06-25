// 图片风格选择弹层（画布生图面板）
import { useRef, useState } from "react";
import { Check, ChevronDown, Smile } from "lucide-react";
import { PromptPopoverPanel } from "@/components/prompt/PromptPopoverPanel";
import { type PromptPopoverInteractionProps } from "@/components/prompt/promptPopoverUtils";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { getImageStyleLabel, IMAGE_STYLE_OPTIONS, type ImageStyleId } from "@/lib/imageStyles";
import { getImageStylePreviewUrl } from "@/lib/imageStylePreviews";
import { cn } from "@/lib/utils";

type ImageStylePopoverProps = PromptPopoverInteractionProps & {
    value?: ImageStyleId;
    onValueChange?: (styleId: ImageStyleId | undefined) => void;
    panelTitle?: string;
    triggerFallbackLabel?: string;
};

// 渲染图片/视频风格选择弹层
export function ImageStylePopover({
    interactionScope = "default",
    popoverPlacement = "top",
    value,
    onValueChange,
    panelTitle = "图片风格",
    triggerFallbackLabel = "风格",
}: ImageStylePopoverProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const selectedLabel = getImageStyleLabel(value);
    const triggerLabel = selectedLabel ?? triggerFallbackLabel;

    usePopoverDismiss(rootRef, open, () => setOpen(false), [panelRef]);

    // 切换弹层开关
    const handleToggleOpen = () => {
        setOpen((current) => !current);
    };

    // 选中风格并关闭弹层
    const handleSelectStyle = (styleId: ImageStyleId | undefined) => {
        onValueChange?.(styleId);
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
                    "nodrag inline-flex h-8 max-w-[140px] cursor-pointer items-center gap-1 rounded-full px-3 text-sm transition",
                    open || selectedLabel
                        ? "bg-violet-50 text-violet-700"
                        : "text-slate-700 hover:bg-slate-100",
                )}
            >
                <Smile className="size-4 shrink-0 text-violet-500" strokeWidth={1.8} />
                <span className="truncate">{triggerLabel}</span>
                <ChevronDown
                    className={cn("size-4 shrink-0 text-slate-400 transition", open ? "rotate-180" : "")}
                    strokeWidth={1.8}
                />
            </button>

            <PromptPopoverPanel
                open={open}
                triggerRef={rootRef}
                panelRef={panelRef}
                interactionScope={interactionScope}
                popoverPlacement={popoverPlacement}
                widthClassName="w-[380px]"
            >
                <p className="mb-2 text-sm font-medium text-slate-900">{panelTitle}</p>
                <div className="nowheel max-h-[420px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => handleSelectStyle(undefined)}
                            className={cn(
                                "relative inline-flex cursor-pointer items-center justify-center rounded-xl border px-2 py-2.5 text-xs leading-5 transition",
                                !value
                                    ? "border-violet-400 bg-violet-50 text-violet-700"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                            )}
                        >
                            {!value ? (
                                <Check
                                    className="absolute top-1.5 right-1.5 size-3 text-violet-500"
                                    strokeWidth={2.5}
                                />
                            ) : null}
                            无风格
                        </button>
                        {IMAGE_STYLE_OPTIONS.map((option) => {
                            const selected = value === option.id;

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleSelectStyle(option.id)}
                                    className={cn(
                                        "relative aspect-4/3 cursor-pointer overflow-hidden rounded-xl border text-left transition",
                                        selected
                                            ? "border-violet-400 ring-1 ring-violet-400"
                                            : "border-slate-200 hover:border-slate-300",
                                    )}
                                >
                                    <img
                                        src={getImageStylePreviewUrl(option.id)}
                                        alt={option.label}
                                        loading="lazy"
                                        className="size-full object-cover"
                                    />
                                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2 pt-8 pb-2 text-center text-xs leading-5 text-white">
                                        {option.label}
                                    </span>
                                    {selected ? (
                                        <Check
                                            className="absolute top-1.5 right-1.5 size-3 rounded-full bg-white/90 text-violet-500"
                                            strokeWidth={2.5}
                                        />
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </PromptPopoverPanel>
        </div>
    );
}
