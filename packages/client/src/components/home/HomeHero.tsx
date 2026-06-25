// 首页 Hero 标题区
import type { HomeAgentTab } from "@/components/home/HomeAgentTabs";

type HomeHeroProps = {
    activeTab: HomeAgentTab;
    nickname?: string;
};

// 根据 Agent 类型生成标题高亮文案
function getHighlightText(activeTab: HomeAgentTab) {
    return activeTab === "novel" ? "专属短剧" : "创作想法";
}

// 根据 Agent 类型生成标题动作文案
function getActionText(activeTab: HomeAgentTab) {
    return activeTab === "novel" ? "一起创作" : "一起聊聊";
}

// 渲染首页 Hero 标题
export function HomeHero({ activeTab, nickname = "" }: HomeHeroProps) {
    const displayName =
        nickname.length > 10 ? `${nickname.slice(0, 10)}...` : nickname;

    return (
        <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="max-w-4xl px-4 text-[clamp(2rem,4vw,2.5rem)] font-extralight leading-tight tracking-wide text-white [-webkit-text-stroke:0.5px_currentColor] [text-shadow:0_0_30px_rgba(0,0,0,0.2)]">
                Hi{" "}
                {displayName && (
                    <span className="bg-gradient-to-r from-white via-violet-100 to-indigo-100 bg-clip-text text-transparent">
                        {displayName}
                    </span>
                )}
                {displayName ? "，" : " "}
                和小麻雀{getActionText(activeTab)}
                <span className="text-white">{getHighlightText(activeTab)}</span>
            </h1>
        </div>
    );
}
