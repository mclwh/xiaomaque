// 分集目录：悬浮在页面左侧，点击跳转并展开对应集
import type { SerieEpisodeItem } from "@/api/episodeScript";
import { cn } from "@/lib/utils";

// EpisodeDirectoryItem 目录展示项
type EpisodeDirectoryItem = {
    episodeNumber: number;
    title: string;
    status?: SerieEpisodeItem["status"];
};

// EpisodeDirectoryProps 分集目录属性
type EpisodeDirectoryProps = {
    episodes: EpisodeDirectoryItem[];
    activeEpisodeNumber?: number;
    onSelect: (episodeNumber: number) => void;
};

// 渲染左侧悬浮分集目录
export function EpisodeDirectory({
    episodes,
    activeEpisodeNumber,
    onSelect,
}: EpisodeDirectoryProps) {
    if (episodes.length === 0) {
        return null;
    }

    return (
        <nav
            aria-label="分集目录"
            className="fixed left-4 top-28 z-10 hidden w-[148px] xl:left-[max(1rem,calc((100vw-920px)/2-168px))] lg:block"
        >
            <div className="max-h-[min(70vh,calc(100vh-8rem))] overflow-y-auto p-2">
                <p className="px-2 py-1.5 text-xs font-medium text-slate-400">分集目录</p>
                <ul className="flex flex-col gap-0.5">
                    {episodes.map((episode) => {
                        const isActive = activeEpisodeNumber === episode.episodeNumber;
                        const isReady =
                            episode.status === "completed" ||
                            episode.status === undefined;

                        return (
                            <li key={episode.episodeNumber}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(episode.episodeNumber)}
                                    className={cn(
                                        "flex w-full cursor-pointer flex-col gap-0.5 rounded-xl px-2 py-2 text-left transition",
                                        isActive ? "text-violet-700" : "text-slate-600 hover:text-slate-900",
                                    )}
                                >
                                    <span className="text-xs font-medium">
                                        第 {episode.episodeNumber} 集
                                    </span>
                                    <span
                                        className={cn(
                                            "line-clamp-2 text-[11px] leading-4",
                                            isReady ? "text-slate-500" : "text-slate-400",
                                        )}
                                    >
                                        {episode.title}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}
