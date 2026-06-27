// 分集剧本列表：每集可展开收起，默认收起
import { Loader2 } from "lucide-react";
import type { SerieEpisodeItem } from "@/api/episodeScript";
import { OutlineAccordionItem } from "@/components/project/OutlineAccordionItem";

// SerieEpisodeListProps 分集列表属性
type SerieEpisodeListProps = {
    episodes: SerieEpisodeItem[];
    expandedEpisodes: Set<number>;
    onToggleEpisode: (episodeNumber: number) => void;
};

// 渲染分集剧本列表
export function SerieEpisodeList({
    episodes,
    expandedEpisodes,
    onToggleEpisode,
}: SerieEpisodeListProps) {
    const sorted = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);

    return (
        <div className="flex flex-col">
            {sorted.map((episode) => {
                const isGenerating = episode.status === "generating";
                const isFailed = episode.status === "failed";
                const isPending = episode.status === "pending" && !episode.content;
                const title = `${episode.episodeNumber}.${episode.title}`;

                return (
                    <OutlineAccordionItem
                        key={episode.episodeNumber}
                        id={`outline-episode-${episode.episodeNumber}`}
                        title={title}
                        expanded={expandedEpisodes.has(episode.episodeNumber)}
                        onToggle={() => onToggleEpisode(episode.episodeNumber)}
                        className="scroll-mt-28"
                    >
                        {isGenerating ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                                <span>本集剧本生成中...</span>
                            </div>
                        ) : null}

                        {isFailed ? (
                            <p className="text-sm text-red-500">本集剧本生成失败</p>
                        ) : null}

                        {isPending ? (
                            <p className="text-sm text-slate-400">等待生成...</p>
                        ) : null}

                        {episode.content ? (
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-600">
                                {episode.content}
                            </pre>
                        ) : null}
                    </OutlineAccordionItem>
                );
            })}
        </div>
    );
}
