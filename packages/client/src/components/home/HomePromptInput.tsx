// 首页创作输入框与工具栏
import { useRef, useState, type ReactNode } from "react";
import {
    ArrowUp,
    AtSign,
    AudioLines,
    ChevronDown,
    Lightbulb,
    Plus,
} from "lucide-react";
import { ModelSelectPopover } from "@/components/prompt/ModelSelectPopover";
import { OutputSettingsPopover } from "@/components/prompt/OutputSettingsPopover";
import { cn } from "@/lib/utils";

// 创作 Agent 输入框占位文案
const CREATIVE_PLACEHOLDER =
    "描述你的想法，可用 @ 引用图片、文本、音频或视频作为参考。";

// HOME_PROMPT_INPUT_DISABLED 首页创作输入是否暂时禁用
const HOME_PROMPT_INPUT_DISABLED = true;

// 渲染工具栏单项按钮
function PromptToolbarItem({
    icon,
    label,
    showChevron = false,
}: {
    icon?: ReactNode;
    label?: string;
    showChevron?: boolean;
}) {
    return (
        <button
            type="button"
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full text-[13px] text-slate-700 transition hover:bg-slate-100"
        >
            {icon}
            {label ? <span>{label}</span> : null}
            {showChevron ? <ChevronDown className="size-3.5 text-slate-400" /> : null}
        </button>
    );
}

// 渲染首页创作 Agent 输入区
export function HomePromptInput() {
    // focused 输入区是否聚焦
    const [focused, setFocused] = useState(false);
    // value 输入框文本内容
    const [value, setValue] = useState("");
    // editorRef 可编辑 div 引用
    const editorRef = useRef<HTMLDivElement>(null);

    // 同步 contentEditable 文本到 state
    const handleInput = () => {
        if (HOME_PROMPT_INPUT_DISABLED) {
            return;
        }

        setValue(editorRef.current?.textContent ?? "");
    };

    // 聚焦输入区
    const handleFocus = () => {
        if (HOME_PROMPT_INPUT_DISABLED) {
            return;
        }

        setFocused(true);
    };

    // 失焦输入区
    const handleBlur = () => {
        setFocused(false);
    };

    return (
        <section className="relative z-[5] flex w-full justify-center">
            <div className="relative w-[780px]">
                <div
                    className={cn(
                        "rounded-[2rem] bg-white p-3 shadow-[0_8px_32px_rgba(15,23,42,0.08)]",
                        HOME_PROMPT_INPUT_DISABLED && "pointer-events-none opacity-50",
                    )}
                    aria-disabled={HOME_PROMPT_INPUT_DISABLED}
                >
                <div
                    className={cn(
                        "mb-4 h-9 overflow-hidden transition-[height] duration-[280ms] ease-out",
                        focused && !HOME_PROMPT_INPUT_DISABLED && "h-[86px]",
                    )}
                >
                    <div
                        ref={editorRef}
                        role="textbox"
                        aria-multiline="true"
                        aria-disabled={HOME_PROMPT_INPUT_DISABLED}
                        contentEditable={!HOME_PROMPT_INPUT_DISABLED}
                        suppressContentEditableWarning
                        data-placeholder={CREATIVE_PLACEHOLDER}
                        tabIndex={HOME_PROMPT_INPUT_DISABLED ? -1 : 0}
                        className={cn(
                            "xyq-prompt-editor box-border size-full overflow-y-auto border-0 bg-transparent p-1.5 text-sm leading-5 text-slate-900 outline-none wrap-break-word whitespace-pre-wrap",
                            !focused && "overflow-hidden text-ellipsis whitespace-nowrap",
                            HOME_PROMPT_INPUT_DISABLED && "cursor-not-allowed select-none",
                        )}
                        onInput={handleInput}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                </div>

                <div className="flex items-center justify-between gap-5">
                    <div className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto">
                        <button
                            type="button"
                            aria-label="添加附件"
                            disabled={HOME_PROMPT_INPUT_DISABLED}
                            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed"
                        >
                            <Plus className="size-4" />
                        </button>

                        <ModelSelectPopover popoverPlacement="bottom" />
                        <PromptToolbarItem
                            icon={<Lightbulb className="size-4 text-slate-600" />}
                            label="创意助手"
                        />
                        <OutputSettingsPopover
                            defaultAspectRatio="auto"
                            labelMode="aspectOnly"
                            popoverPlacement="bottom"
                        />
                        <PromptToolbarItem label="自动时长" showChevron />
                        <button
                            type="button"
                            aria-label="引用素材"
                            disabled={HOME_PROMPT_INPUT_DISABLED}
                            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed"
                        >
                            <AtSign className="size-4" />
                        </button>
                        <button
                            type="button"
                            aria-label="对话模式"
                            disabled={HOME_PROMPT_INPUT_DISABLED}
                            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed"
                        >
                            <AudioLines className="size-4" />
                        </button>
                    </div>

                    <button
                        type="button"
                        aria-label="发送"
                        disabled={HOME_PROMPT_INPUT_DISABLED || !value.trim()}
                        className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-200 text-slate-400 transition enabled:bg-slate-900 enabled:text-white enabled:hover:bg-slate-800 disabled:cursor-not-allowed"
                    >
                        <ArrowUp className="size-4" />
                    </button>
                </div>
                </div>

                {HOME_PROMPT_INPUT_DISABLED ? (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                        <span className="rounded-full bg-white/95 px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
                            开发中...
                        </span>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
