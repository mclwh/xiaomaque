// 短剧 Agent 剧本上传与生成面板
import { Grid3x3, Sparkles } from "lucide-react";
import { NovelAiTabContent } from "@/components/novel/NovelAiTabContent";
import { NovelScriptTabButton } from "@/components/novel/NovelScriptTabButton";
import { useEnterFreeCanvas } from "@/hooks/useEnterFreeCanvas";

// 剧本面板 Tab 类型（面板内可切换）
export type NovelScriptTab = "ai";

type NovelScriptPanelProps = {
    activeTab: NovelScriptTab;
    onTabChange: (tab: NovelScriptTab) => void;
};

type ScriptTabConfig = {
    id: NovelScriptTab | "canvas";
    label: string;
    icon: typeof Sparkles;
    opensPage?: boolean;
};

/*
 * SCRIPT_TABS 剧本面板 Tab 配置
 */
const SCRIPT_TABS: ScriptTabConfig[] = [
    { id: "ai", label: "AI 生剧本", icon: Sparkles },
    { id: "canvas", label: "自由画布", icon: Grid3x3, opensPage: true },
];

// 渲染短剧 Agent 剧本操作面板
export function NovelScriptPanel({ activeTab, onTabChange }: NovelScriptPanelProps) {
    const { enterFreeCanvas, loading, errorMessage } = useEnterFreeCanvas();

    // 处理 Tab 点击：自由画布先创建项目再跳转，其余切换面板内容
    const handleTabClick = (tab: ScriptTabConfig) => {
        if (tab.opensPage) {
            void enterFreeCanvas();
            return;
        }

        onTabChange(tab.id as NovelScriptTab);
    };

    return (
        <section className="relative mx-auto w-full max-w-[720px]">
            <div className="xyq-novel-tabs mx-auto flex w-full max-w-[720px] max-h-[min(80vh,720px)] flex-col">
                <div className="flex h-10 shrink-0 items-stretch overflow-hidden rounded-t-3xl bg-[#d9d9df]">
                    {SCRIPT_TABS.map((tab, index) => {
                        // activeIndex 当前激活 Tab 的下标
                        const activeIndex = SCRIPT_TABS.findIndex(
                            (item) => item.id === activeTab,
                        );

                        // hasDivider 与右侧相邻 Tab 同为未选中时显示分隔线
                        const hasDivider =
                            activeTab !== tab.id &&
                            index + 1 !== activeIndex &&
                            index !== SCRIPT_TABS.length - 1;

                        return (
                            <NovelScriptTabButton
                                key={tab.id}
                                label={tab.label}
                                icon={tab.icon}
                                isActive={!tab.opensPage && activeTab === tab.id}
                                index={index}
                                isFirst={index === 0}
                                isLast={index === SCRIPT_TABS.length - 1}
                                hasDivider={hasDivider}
                                disabled={tab.opensPage && loading}
                                onClick={() => handleTabClick(tab)}
                            />
                        );
                    })}
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-b-3xl bg-white p-3">
                    {activeTab === "ai" ? <NovelAiTabContent /> : null}
                </div>
            </div>

            {errorMessage ? (
                <p className="mt-2 text-center text-xs text-red-500">{errorMessage}</p>
            ) : null}
        </section>
    );
}
