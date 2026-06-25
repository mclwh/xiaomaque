// AI 生剧本 Tab：故事输入框与底部配置选择器
import { useState } from "react";
import { BookOpen, ChevronDown, SquareDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NovelAiSelectorProps = {
    label: string;
    icon?: typeof BookOpen;
    showDivider?: boolean;
    onClick?: () => void;
};

// 渲染 AI 剧本面板底部单项选择器
function NovelAiSelector({ label, icon: Icon, showDivider = true, onClick }: NovelAiSelectorProps) {
    return (
        <>
            <button
                type="button"
                onClick={onClick}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 px-3 text-sm text-slate-700 hover:text-slate-900"
            >
                {Icon ? <Icon className="size-4 text-slate-500" strokeWidth={1.8} /> : null}
                <span>{label}</span>
                <ChevronDown className="size-3.5 text-slate-400" strokeWidth={2} />
            </button>
            {showDivider ? <span className="h-4 w-px shrink-0 bg-slate-200" aria-hidden /> : null}
        </>
    );
}

// 渲染 AI 生剧本 Tab 内容区
export function NovelAiTabContent() {
    // storyText 故事输入内容
    const [storyText, setStoryText] = useState("");
    // canGenerate 是否可点击立即生成
    const canGenerate = storyText.trim().length > 0;

    return (
        <div className="xyq-novel-ai-panel flex h-full min-h-0 flex-col gap-3">
            <textarea
                value={storyText}
                onChange={(event) => setStoryText(event.target.value)}
                placeholder="在此输入你构想的故事内容。可以尝试输入这些要素：故事设定、主角特征、剧情脉络、最终结局等等"
                className="xyq-novel-textarea h-[144px] w-full shrink-0 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-300"
            />

            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center">
                    <NovelAiSelector icon={BookOpen} label="风格库" />
                    <NovelAiSelector icon={SquareDashed} label="默认比例" />
                    <NovelAiSelector label="10 集" showDivider={false} />
                </div>

                <Button
                    type="button"
                    disabled={!canGenerate}
                    className={cn(
                        "h-9 shrink-0 rounded-full px-6 text-sm font-medium",
                        canGenerate
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "cursor-not-allowed bg-[#e8e8ec] text-white hover:bg-[#e8e8ec]",
                    )}
                >
                    立即生成
                </Button>
            </div>
        </div>
    );
}
