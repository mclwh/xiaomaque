// 首页：复现小麻雀网页版创作主页
import { useState } from "react";
import { HomeAgentTabs, type HomeAgentTab } from "@/components/home/HomeAgentTabs";
import { HomeHero } from "@/components/home/HomeHero";
import { HomePromptInput } from "@/components/home/HomePromptInput";
import { NovelScriptPanel, type NovelScriptTab } from "@/components/novel/NovelScriptPanel";

// 渲染小麻雀首页
export function HomePage() {
        const [activeTab, setActiveTab] = useState<HomeAgentTab>("creative");
        // scriptTab 短剧 Agent 剧本面板 Tab
        const [scriptTab, setScriptTab] = useState<NovelScriptTab>("ai");

        return (
                <div className="relative min-h-full">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-size-[18px_18px] opacity-35"
                        />
                        <div className="relative z-[2] mx-auto flex w-full max-w-[960px] flex-col items-center gap-8 px-4 py-10 md:py-14">
                                <div className="flex w-full flex-col items-center gap-6">
                                    <HomeHero activeTab={activeTab} />
                                    <HomeAgentTabs activeTab={activeTab} onChange={setActiveTab} />
                                </div>

                                {activeTab === "creative" ? (
                                        <HomePromptInput />
                                ) : (
                                        <section className="relative z-[5] flex w-full justify-center">
                                                <NovelScriptPanel activeTab={scriptTab} onTabChange={setScriptTab} />
                                        </section>
                                )}
                        </div>
                </div>
        );
}
