// 短剧 AI 剧本集数选择弹层
import { useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import { PromptPopoverPanel } from "@/components/prompt/PromptPopoverPanel";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { cn } from "@/lib/utils";

// PRESET_EPISODE_COUNTS 预设集数选项
const PRESET_EPISODE_COUNTS = [1, 12, 24, 36, 48] as const;

// DEFAULT_EPISODE_COUNT 默认集数
const DEFAULT_EPISODE_COUNT = 12;

// CUSTOM_EPISODE_MIN 自定义集数下限
const CUSTOM_EPISODE_MIN = 1;

// CUSTOM_EPISODE_MAX 自定义集数上限
const CUSTOM_EPISODE_MAX = 999;

type NovelEpisodeCountPopoverProps = {
    value?: number;
    onValueChange?: (count: number) => void;
    showDivider?: boolean;
};

// 判断集数是否为预设值
function isPresetEpisodeCount(count: number): boolean {
    return PRESET_EPISODE_COUNTS.includes(count as (typeof PRESET_EPISODE_COUNTS)[number]);
}

// 将自定义输入解析为合法集数
function parseCustomEpisodeCount(raw: string): number | null {
    const trimmed = raw.trim();

    if (!trimmed) {
        return null;
    }

    const parsed = Number.parseInt(trimmed, 10);

    if (!Number.isFinite(parsed) || parsed < CUSTOM_EPISODE_MIN || parsed > CUSTOM_EPISODE_MAX) {
        return null;
    }

    return parsed;
}

// 渲染集数选择弹层
export function NovelEpisodeCountPopover({
    value = DEFAULT_EPISODE_COUNT,
    onValueChange,
    showDivider = false,
}: NovelEpisodeCountPopoverProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    // customInput 自定义集数输入框内容
    const [customInput, setCustomInput] = useState(
        isPresetEpisodeCount(value) ? "" : String(value),
    );

    usePopoverDismiss(rootRef, open, () => setOpen(false), [panelRef]);

    // 切换弹层开关
    const handleToggleOpen = () => {
        setOpen((current) => {
            const next = !current;

            if (next && !isPresetEpisodeCount(value)) {
                setCustomInput(String(value));
            }

            return next;
        });
    };

    // 选中预设集数
    const handleSelectPreset = (count: number) => {
        onValueChange?.(count);
        setCustomInput("");
        setOpen(false);
    };

    // 应用自定义集数
    const handleApplyCustom = () => {
        const parsed = parseCustomEpisodeCount(customInput);

        if (parsed === null) {
            return;
        }

        onValueChange?.(parsed);
        setOpen(false);
    };

    // 自定义输入框回车确认
    const handleCustomKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleApplyCustom();
        }
    };

    const usingCustom = !isPresetEpisodeCount(value);

    return (
        <>
            <div ref={rootRef} className="relative">
                <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    onClick={handleToggleOpen}
                    className={cn(
                        "inline-flex h-9 cursor-pointer items-center gap-1.5 px-3 text-sm transition",
                        open ? "text-violet-700" : "text-slate-700 hover:text-slate-900",
                    )}
                >
                    <span>{value} 集</span>
                    <ChevronDown
                        className={cn("size-3.5 text-slate-400 transition", open ? "rotate-180" : "")}
                        strokeWidth={2}
                    />
                </button>

                <PromptPopoverPanel
                    open={open}
                    triggerRef={rootRef}
                    panelRef={panelRef}
                    popoverPlacement="top"
                    widthClassName="w-[280px]"
                >
                    <p className="mb-3 text-sm font-medium text-slate-900">自定义集数</p>
                    <div className="grid grid-cols-3 gap-2">
                        {PRESET_EPISODE_COUNTS.map((count) => {
                            const isActive = value === count;

                            return (
                                <button
                                    key={count}
                                    type="button"
                                    onClick={() => handleSelectPreset(count)}
                                    className={cn(
                                        "inline-flex h-9 cursor-pointer items-center justify-center rounded-xl border text-sm transition",
                                        isActive
                                            ? "border-violet-300 bg-violet-50 font-medium text-violet-700"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                                    )}
                                >
                                    {count} 集
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="mb-2 text-xs text-slate-500">自定义集数</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={CUSTOM_EPISODE_MIN}
                                max={CUSTOM_EPISODE_MAX}
                                value={customInput}
                                placeholder={`${CUSTOM_EPISODE_MIN}-${CUSTOM_EPISODE_MAX}`}
                                onChange={(event) => setCustomInput(event.target.value)}
                                onKeyDown={handleCustomKeyDown}
                                className={cn(
                                    "h-9 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-300",
                                    usingCustom ? "border-violet-300" : "border-slate-200",
                                )}
                            />
                            <button
                                type="button"
                                onClick={handleApplyCustom}
                                className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 text-sm text-white transition hover:bg-slate-800"
                            >
                                确定
                            </button>
                        </div>
                    </div>
                </PromptPopoverPanel>
            </div>
            {showDivider ? <span className="h-4 w-px shrink-0 bg-slate-200" aria-hidden /> : null}
        </>
    );
}
