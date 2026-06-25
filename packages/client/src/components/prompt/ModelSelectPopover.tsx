// 模型选择弹层（首页与画布共用）
import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Check, ChevronDown } from "lucide-react";
import { PromptPopoverPanel } from "@/components/prompt/PromptPopoverPanel";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import {
    getGenerationModelOptions,
    type GenerationMediaType,
} from "@/lib/generationOptions";
import { cn } from "@/lib/utils";

type ModelSelectPopoverProps = {
    mediaType?: GenerationMediaType;
    interactionScope?: "canvas" | "default";
    popoverPlacement?: "top" | "bottom";
    value?: string;
    onValueChange?: (modelId: string) => void;
};

// 渲染模型选择弹层
export function ModelSelectPopover({
    mediaType = "image",
    interactionScope = "default",
    popoverPlacement = "top",
    value,
    onValueChange,
}: ModelSelectPopoverProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const modelOptions = useMemo(() => getGenerationModelOptions(mediaType), [mediaType]);
    const [internalModelId, setInternalModelId] = useState(modelOptions[0]?.id ?? "");
    const selectedModelId = value ?? internalModelId;

    const selectedModel =
        modelOptions.find((option) => option.id === selectedModelId) ?? modelOptions[0];

    // 媒体类型变化时重置默认模型
    useEffect(() => {
        if (value === undefined) {
            setInternalModelId(modelOptions[0]?.id ?? "");
        }

        setOpen(false);
    }, [modelOptions, value]);

    usePopoverDismiss(rootRef, open, () => setOpen(false), [panelRef]);

    // 切换弹层开关
    const handleToggleOpen = () => {
        setOpen((current) => !current);
    };

    // 选中模型并关闭弹层
    const handleSelectModel = (modelId: string) => {
        if (value === undefined) {
            setInternalModelId(modelId);
        }

        onValueChange?.(modelId);
        setOpen(false);
    };

    if (!selectedModel) {
        return null;
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={handleToggleOpen}
                className={cn(
                    "inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-3 text-sm transition",
                    open ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-100",
                )}
            >
                <BarChart3 className="size-4 text-violet-500" strokeWidth={1.8} />
                {selectedModel.label}
                <ChevronDown className={cn("size-4 text-slate-400 transition", open ? "rotate-180" : "")} strokeWidth={1.8} />
            </button>

            <PromptPopoverPanel
                open={open}
                triggerRef={rootRef}
                panelRef={panelRef}
                interactionScope={interactionScope}
                popoverPlacement={popoverPlacement}
                widthClassName="w-[360px]"
                className="p-3"
            >
                <p className="px-2 pb-2 text-sm font-medium text-slate-900">模型选择</p>
                <div className="flex flex-col gap-1">
                    {modelOptions.map((option) => {
                        const selected = selectedModelId === option.id;

                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelectModel(option.id)}
                                className={cn(
                                    "flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition",
                                    selected ? "bg-slate-100" : "hover:bg-slate-50",
                                )}
                            >
                                <BarChart3 className="mt-0.5 size-4 shrink-0 text-violet-500" strokeWidth={1.8} />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                                        {option.description}
                                    </span>
                                </span>
                                {selected ? (
                                    <Check className="mt-0.5 size-4 shrink-0 text-violet-500" strokeWidth={2.5} />
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </PromptPopoverPanel>
        </div>
    );
}
