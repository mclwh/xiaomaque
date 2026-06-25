// 首页 Agent 类型切换标签
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type HomeAgentTab = "creative" | "novel";

type HomeAgentTabsProps = {
    activeTab: HomeAgentTab;
    onChange: (tab: HomeAgentTab) => void;
};

/*
 * AGENT_TABS Agent 标签配置
 * label 标签文案
 * value 标签值
 */
const AGENT_TABS: { label: string; value: HomeAgentTab }[] = [
    { label: "创作 Agent", value: "creative" },
    { label: "短剧 Agent", value: "novel" },
];

// 渲染创作 / 短剧 Agent 切换标签
export function HomeAgentTabs({ activeTab, onChange }: HomeAgentTabsProps) {
    const activeIndex = AGENT_TABS.findIndex((tab) => tab.value === activeTab);

    return (
        <nav
            aria-label="Agent 类型"
            role="tablist"
            className="relative inline-flex h-10 w-fit items-center rounded-[30px] bg-white/60 p-0.5 shadow-[0_4px_24px_rgba(0,0,0,0.12)] backdrop-blur"
        >
            <span
                aria-hidden
                className="absolute top-0.5 h-9 rounded-[58px] bg-slate-900 transition-all duration-300 ease-out"
                style={{
                    width: "calc(50% - 2px)",
                    transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 2}px))`,
                }}
            />
            {AGENT_TABS.map((tab) => {
                const isActive = tab.value === activeTab;

                return (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={cn(
                            "relative z-[1] inline-flex h-9 min-w-[120px] cursor-pointer items-center justify-center gap-1 rounded-[58px] px-4 text-[13px] font-normal transition-colors",
                            isActive ? "text-white" : "text-slate-700 hover:text-slate-900",
                        )}
                        onClick={() => onChange(tab.value)}
                    >
                        {tab.label}
                        {isActive && tab.value === "creative" ? (
                            <Sparkles className="size-3.5 text-white/90" />
                        ) : null}
                    </button>
                );
            })}
        </nav>
    );
}
