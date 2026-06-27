// 剧情大纲步骤：展示原始创意、剧本摘要与分集剧本
import { ChevronRight, Loader2, MoreHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useScriptOutline } from "@/hooks/useScriptOutline";
import { useEpisodeScript } from "@/hooks/useEpisodeScript";
import { EpisodeDirectory } from "@/components/project/EpisodeDirectory";
import { OutlineAccordionItem } from "@/components/project/OutlineAccordionItem";
import { OutlineBackToTop } from "@/components/project/OutlineBackToTop";
import { ScriptSummaryContent } from "@/components/project/ScriptSummaryContent";
import { SerieEpisodeList } from "@/components/project/SerieEpisodeList";

// OutlineSectionKey 大纲折叠区块标识
type OutlineSectionKey = "source" | "summary" | "episodes";

// ProjectOutlineStepProps 剧情大纲步骤属性
type ProjectOutlineStepProps = {
    projectId: number;
    onProjectTitleChange?: (title: string) => void;
};

// 渲染剧情大纲步骤内容
export function ProjectOutlineStep({ projectId, onProjectTitleChange }: ProjectOutlineStepProps) {
    // expandedSections 当前展开的大纲区块（默认全部收起）
    const [expandedSections, setExpandedSections] = useState<Set<OutlineSectionKey>>(
        () => new Set(),
    );
    // expandedEpisodes 当前展开的分集（默认全部收起）
    const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(() => new Set());
    // activeEpisodeNumber 目录高亮集数
    const [activeEpisodeNumber, setActiveEpisodeNumber] = useState<number | undefined>();

    const { script, loading, generating, errorMessage, retryGenerate } = useScriptOutline({
        projectId,
        onSummaryComplete: onProjectTitleChange,
    });

    const summaryCompleted = script?.summaryStatus === "completed";

    const {
        serieContent,
        serieContentStatus,
        serieContentError,
        generating: episodeGenerating,
        errorMessage: episodeErrorMessage,
        completedCount,
        totalCount,
        retryGenerate: retryEpisodeGenerate,
    } = useEpisodeScript({
        projectId,
        summaryCompleted,
    });

    // directoryEpisodes 分集目录数据
    const directoryEpisodes = useMemo(() => {
        if (serieContent && serieContent.length > 0) {
            return [...serieContent].sort((a, b) => a.episodeNumber - b.episodeNumber);
        }

        if (totalCount > 0) {
            return Array.from({ length: totalCount }, (_, index) => ({
                episodeNumber: index + 1,
                title: `第 ${index + 1} 集`,
                status: "pending" as const,
            }));
        }

        return [];
    }, [serieContent, totalCount]);

    // 切换大纲区块展开状态
    const toggleSection = (key: OutlineSectionKey) => {
        setExpandedSections((current) => {
            const next = new Set(current);

            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }

            return next;
        });
    };

    // 切换单集展开状态
    const toggleEpisode = (episodeNumber: number) => {
        setExpandedEpisodes((current) => {
            const next = new Set(current);

            if (next.has(episodeNumber)) {
                next.delete(episodeNumber);
            } else {
                next.add(episodeNumber);
            }

            return next;
        });
    };

    // 目录点击：展开分集区块与目标集，并滚动定位
    const handleEpisodeDirectorySelect = useCallback((episodeNumber: number) => {
        setExpandedSections((current) => new Set(current).add("episodes"));
        setExpandedEpisodes((current) => new Set(current).add(episodeNumber));
        setActiveEpisodeNumber(episodeNumber);

        window.requestAnimationFrame(() => {
            document
                .getElementById(`outline-episode-${episodeNumber}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }, []);

    // 滚动时更新目录高亮集数
    useEffect(() => {
        if (directoryEpisodes.length === 0) {
            return;
        }

        const handleScroll = () => {
            const offset = 120;
            let current: number | undefined;

            for (const episode of directoryEpisodes) {
                const element = document.getElementById(
                    `outline-episode-${episode.episodeNumber}`,
                );

                if (!element) {
                    continue;
                }

                if (element.getBoundingClientRect().top <= offset) {
                    current = episode.episodeNumber;
                }
            }

            setActiveEpisodeNumber(current ?? directoryEpisodes[0]?.episodeNumber);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [directoryEpisodes]);

    // episodeCountLabel 集数展示文案
    const episodeCountLabel = script?.episodeCount ? `共 ${script.episodeCount} 集` : "共 — 集";

    if (loading && !script) {
        return (
            <div className="mx-auto flex min-h-[320px] max-w-[920px] items-center justify-center px-6 py-16 text-sm text-slate-400">
                加载剧本大纲...
            </div>
        );
    }

    return (
        <>
            {directoryEpisodes.length > 0 ? (
                <EpisodeDirectory
                    episodes={directoryEpisodes}
                    activeEpisodeNumber={activeEpisodeNumber}
                    onSelect={handleEpisodeDirectorySelect}
                />
            ) : null}

            <div className="mx-auto w-full max-w-[920px] px-4 py-8 md:px-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-base font-medium text-slate-800">{episodeCountLabel}</h2>

                    <button
                        type="button"
                        aria-label="更多操作"
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-[#ececf0] text-slate-500 transition hover:bg-[#e2e2e8]"
                    >
                        <MoreHorizontal className="size-4" strokeWidth={2} />
                    </button>
                </div>

                <div className="overflow-hidden rounded-t-3xl bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                    <OutlineAccordionItem
                        title="原始创意"
                        expanded={expandedSections.has("source")}
                        onToggle={() => toggleSection("source")}
                    >
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                            {script?.source?.trim() || "暂无原始创意"}
                        </p>
                    </OutlineAccordionItem>

                    <OutlineAccordionItem
                        title="剧本摘要"
                        expanded={expandedSections.has("summary")}
                        onToggle={() => toggleSection("summary")}
                    >
                        {generating || script?.summaryStatus === "generating" ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                                <span>剧本摘要生成中，请稍候...</span>
                            </div>
                        ) : null}

                        {!generating && script?.summaryStatus === "failed" ? (
                            <div className="flex flex-col gap-3">
                                <p className="text-sm leading-6 text-red-500">
                                    {script.params.summaryError ||
                                        errorMessage ||
                                        "剧本摘要生成失败"}
                                </p>
                                <button
                                    type="button"
                                    onClick={retryGenerate}
                                    className="inline-flex h-8 w-fit cursor-pointer items-center rounded-full bg-slate-900 px-4 text-xs font-medium text-white transition hover:bg-slate-800"
                                >
                                    重新生成
                                </button>
                            </div>
                        ) : null}

                        {script?.summaryStatus === "completed" && script.summary ? (
                            <ScriptSummaryContent summary={script.summary} />
                        ) : null}

                        {script?.summaryStatus === "completed" &&
                        !script.summary &&
                        script.summaryText ? (
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-600">
                                {script.summaryText}
                            </pre>
                        ) : null}

                        {!generating &&
                        script?.summaryStatus !== "generating" &&
                        script?.summaryStatus !== "failed" &&
                        script?.summaryStatus !== "completed" ? (
                            <p className="text-sm text-slate-400">等待生成剧本摘要...</p>
                        ) : null}
                    </OutlineAccordionItem>

                    <OutlineAccordionItem
                        title="分集剧本"
                        expanded={expandedSections.has("episodes")}
                        onToggle={() => toggleSection("episodes")}
                    >
                        {!summaryCompleted ? (
                            <p className="text-sm text-slate-400">请先完成剧本摘要</p>
                        ) : null}

                        {summaryCompleted &&
                        (episodeGenerating || serieContentStatus === "generating") ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                                    <span>
                                        分集剧本生成中
                                        {totalCount > 0
                                            ? `（${completedCount}/${totalCount} 集）`
                                            : "..."}
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        {summaryCompleted &&
                        !episodeGenerating &&
                        serieContentStatus === "failed" ? (
                            <div className="flex flex-col gap-3">
                                <p className="text-sm leading-6 text-red-500">
                                    {serieContentError ||
                                        episodeErrorMessage ||
                                        "分集剧本生成失败"}
                                </p>
                                <button
                                    type="button"
                                    onClick={retryEpisodeGenerate}
                                    className="inline-flex h-8 w-fit cursor-pointer items-center rounded-full bg-slate-900 px-4 text-xs font-medium text-white transition hover:bg-slate-800"
                                >
                                    重新生成
                                </button>
                            </div>
                        ) : null}

                        {summaryCompleted && serieContent && serieContent.length > 0 ? (
                            <SerieEpisodeList
                                episodes={serieContent}
                                expandedEpisodes={expandedEpisodes}
                                onToggleEpisode={toggleEpisode}
                            />
                        ) : null}

                        {summaryCompleted &&
                        serieContentStatus === "pending" &&
                        !episodeGenerating &&
                        (!serieContent || serieContent.length === 0) ? (
                            <p className="text-sm text-slate-400">等待生成分集剧本...</p>
                        ) : null}
                    </OutlineAccordionItem>
                </div>

                {errorMessage && script?.summaryStatus !== "failed" ? (
                    <p className="mt-3 text-xs leading-5 text-red-500">{errorMessage}</p>
                ) : null}
            </div>

            <OutlineBackToTop />
        </>
    );
}
