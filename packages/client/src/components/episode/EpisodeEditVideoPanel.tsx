// 分集编辑页：右侧分镜视频预览面板
import { EpisodeFragmentSegmentedVideoPlayer } from "@/components/episode/EpisodeFragmentSegmentedVideoPlayer";
import type { SerieFragment } from "@/lib/serieFragments";

type EpisodeEditVideoPanelProps = {
    fragments: SerieFragment[];
    playingFragmentId: string | null;
    onPlayingFragmentChange: (fragmentId: string) => void;
};

// 渲染当前分镜视频预览区
export function EpisodeEditVideoPanel({
    fragments,
    playingFragmentId,
    onPlayingFragmentChange,
}: EpisodeEditVideoPanelProps) {
    return (
        <aside className="flex min-h-0 w-[460px] shrink-0 flex-col border-l border-black/5 bg-white">
            {fragments.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-[30px] text-center text-sm text-slate-400">
                    请选择底部分镜
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col px-[30px] py-4">
                    <div className="relative mx-auto flex w-full max-w-[320px] flex-1 flex-col">
                        <EpisodeFragmentSegmentedVideoPlayer
                            fragments={fragments}
                            playingFragmentId={playingFragmentId}
                            onPlayingFragmentChange={onPlayingFragmentChange}
                        />
                    </div>
                </div>
            )}
        </aside>
    );
}
