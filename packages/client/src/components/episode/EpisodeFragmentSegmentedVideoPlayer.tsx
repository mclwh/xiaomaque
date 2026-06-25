// 分集编辑页：带分镜分段进度条的视频播放器
import { Download, MonitorPlay, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    buildEpisodeVideoTimelineSegments,
    formatVideoTimelineClock,
    resolveEpisodeTimelineSegmentFillRatio,
    resolveEpisodeVideoTimelineTotalDuration,
    resolveFragmentPlaybackFromGlobalTime,
    resolveGlobalTimeFromFragmentPlayback,
    resolveNextPlayableFragmentId,
    resolveVideoTimelineSeekTime,
} from "@/lib/episodeVideoTimeline";
import { resolveSerieFragmentCoverKey, type SerieFragment } from "@/lib/serieFragments";
import { resolveStoragePreviewUrl, resolveStorageUrl } from "@/lib/storageUrl";
import { cn } from "@/lib/utils";

type EpisodeFragmentSegmentedVideoPlayerProps = {
    fragments: SerieFragment[];
    playingFragmentId: string | null;
    onPlayingFragmentChange: (fragmentId: string) => void;
    className?: string;
};

// 渲染带分镜分段进度条的视频播放器
export function EpisodeFragmentSegmentedVideoPlayer({
    fragments,
    playingFragmentId,
    onPlayingFragmentChange,
    className,
}: EpisodeFragmentSegmentedVideoPlayerProps) {
    // videoRef 视频元素引用
    const videoRef = useRef<HTMLVideoElement | null>(null);
    // trackRef 分段进度条容器引用
    const trackRef = useRef<HTMLDivElement | null>(null);
    // isSeeking 是否正在拖动进度条
    const isSeekingRef = useRef(false);
    // autoLinkNextRef 是否自动衔接下一片段
    const autoLinkNextRef = useRef(true);
    // playingFragmentIdRef 当前播放分镜 ID
    const playingFragmentIdRef = useRef(playingFragmentId);
    // timelineSegmentsRef 时间轴分段缓存
    const timelineSegmentsRef = useRef(buildEpisodeVideoTimelineSegments(fragments));
    // shouldResumePlayRef 切换分镜后是否继续播放
    const shouldResumePlayRef = useRef(false);
    // pendingSeekTimeRef 切换分镜后待跳转的本地时间
    const pendingSeekTimeRef = useRef<number | null>(null);
    // autoPlayAttemptedRef 当前视频是否已尝试自动播放
    const autoPlayAttemptedRef = useRef(false);
    // isPlaying 是否正在播放
    const [isPlaying, setIsPlaying] = useState(false);
    // globalCurrentTime 全局时间轴当前位置（秒）
    const [globalCurrentTime, setGlobalCurrentTime] = useState(0);
    // autoLinkNext 当前片段播完后自动播放下一片段
    const [autoLinkNext, setAutoLinkNext] = useState(true);
    // muted 是否静音
    const [muted, setMuted] = useState(false);

    playingFragmentIdRef.current = playingFragmentId;
    autoLinkNextRef.current = autoLinkNext;

    // timelineSegments 分集全部分镜时间轴分段
    const timelineSegments = useMemo(
        () => buildEpisodeVideoTimelineSegments(fragments),
        [fragments],
    );

    timelineSegmentsRef.current = timelineSegments;

    // totalDuration 分集时间轴总时长
    const totalDuration = useMemo(
        () => resolveEpisodeVideoTimelineTotalDuration(timelineSegments),
        [timelineSegments],
    );

    // playingFragment 当前播放分镜
    const playingFragment = useMemo(
        () => fragments.find((fragment) => fragment.id === playingFragmentId) ?? null,
        [fragments, playingFragmentId],
    );

    // playingSegment 当前播放分镜在时间轴上的区间
    const playingSegment = useMemo(
        () => timelineSegments.find((segment) => segment.fragmentId === playingFragmentId) ?? null,
        [playingFragmentId, timelineSegments],
    );

    // videoUrl 当前分镜视频地址
    const videoUrl = playingFragment?.video ? resolveStorageUrl(playingFragment.video) : null;
    // posterUrl 当前分镜封面地址
    const coverKey = playingFragment ? resolveSerieFragmentCoverKey(playingFragment) : null;
    const posterUrl = coverKey ? resolveStoragePreviewUrl(coverKey) : null;
    // hasCurrentVideo 当前分镜是否可播放
    const hasCurrentVideo = Boolean(videoUrl);
    // hasAnyVideo 是否存在任一分镜视频
    const hasAnyVideo = timelineSegments.some((segment) => segment.hasVideo);

    // 切换播放或暂停
    const handleTogglePlay = useCallback(() => {
        const video = videoRef.current;

        if (!video || !hasCurrentVideo) {
            return;
        }

        if (video.paused) {
            void video.play().catch(() => undefined);
            return;
        }

        video.pause();
    }, [hasCurrentVideo]);

    // 跳转到全局时间轴位置
    const seekToGlobalTime = useCallback(
        (globalTimeSec: number) => {
            const playback = resolveFragmentPlaybackFromGlobalTime(timelineSegments, globalTimeSec);

            if (!playback) {
                return;
            }

            setGlobalCurrentTime(
                resolveGlobalTimeFromFragmentPlayback(
                    playback.segment,
                    playback.localTimeSec,
                    playback.segment.durationSec,
                ),
            );

            if (playback.segment.fragmentId !== playingFragmentIdRef.current) {
                pendingSeekTimeRef.current = playback.localTimeSec;
                shouldResumePlayRef.current = isPlaying;
                onPlayingFragmentChange(playback.segment.fragmentId);
                return;
            }

            const video = videoRef.current;

            if (video && hasCurrentVideo) {
                video.currentTime = playback.localTimeSec;
            }
        },
        [hasCurrentVideo, isPlaying, onPlayingFragmentChange, timelineSegments],
    );

    // 根据点击位置跳转播放进度
    const seekByClientX = useCallback(
        (clientX: number) => {
            const track = trackRef.current;

            if (!track || totalDuration <= 0) {
                return;
            }

            const rect = track.getBoundingClientRect();
            const ratio = (clientX - rect.left) / rect.width;
            const nextGlobalTime = resolveVideoTimelineSeekTime(ratio, totalDuration);

            seekToGlobalTime(nextGlobalTime);
        },
        [seekToGlobalTime, totalDuration],
    );

    // 绑定视频事件（仅在当前视频地址变化时重置）
    useEffect(() => {
        const video = videoRef.current;

        if (!video || !videoUrl) {
            return;
        }

        autoPlayAttemptedRef.current = false;

        const tryAutoPlay = () => {
            if (autoPlayAttemptedRef.current) {
                return;
            }

            autoPlayAttemptedRef.current = true;

            if (shouldResumePlayRef.current) {
                void video.play().catch(() => undefined);
                shouldResumePlayRef.current = false;
            }
        };

        const handleLoadedMetadata = () => {
            if (pendingSeekTimeRef.current !== null) {
                video.currentTime = pendingSeekTimeRef.current;
                pendingSeekTimeRef.current = null;
            }
        };

        const handleDurationChange = () => {
            if (pendingSeekTimeRef.current !== null) {
                video.currentTime = pendingSeekTimeRef.current;
                pendingSeekTimeRef.current = null;
            }
        };

        const handleCanPlay = () => {
            if (pendingSeekTimeRef.current !== null) {
                video.currentTime = pendingSeekTimeRef.current;
                pendingSeekTimeRef.current = null;
            }

            tryAutoPlay();
        };

        const handleTimeUpdate = () => {
            if (isSeekingRef.current || !playingSegment) {
                return;
            }

            const nextGlobalTime = resolveGlobalTimeFromFragmentPlayback(
                playingSegment,
                video.currentTime,
                Number.isFinite(video.duration) ? video.duration : playingSegment.durationSec,
            );

            setGlobalCurrentTime(nextGlobalTime);
        };

        const handlePlay = () => {
            setIsPlaying(true);
        };

        const handlePause = () => {
            setIsPlaying(false);
        };

        const handleEnded = () => {
            if (!autoLinkNextRef.current) {
                setIsPlaying(false);
                return;
            }

            const nextFragmentId = resolveNextPlayableFragmentId(
                timelineSegmentsRef.current,
                playingFragmentIdRef.current ?? "",
            );

            if (!nextFragmentId) {
                setIsPlaying(false);
                return;
            }

            shouldResumePlayRef.current = true;
            onPlayingFragmentChange(nextFragmentId);
        };

        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("durationchange", handleDurationChange);
        video.addEventListener("canplay", handleCanPlay);
        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("ended", handleEnded);

        if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            tryAutoPlay();
        }

        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("durationchange", handleDurationChange);
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
            video.removeEventListener("ended", handleEnded);
        };
    }, [onPlayingFragmentChange, playingSegment, videoUrl]);

    // 手动切换分镜时重置到该分镜起点
    useEffect(() => {
        if (!playingSegment) {
            setGlobalCurrentTime(0);
            return;
        }

        if (shouldResumePlayRef.current || pendingSeekTimeRef.current !== null) {
            return;
        }

        setGlobalCurrentTime(playingSegment.startSec);

        const video = videoRef.current;

        if (video && videoUrl) {
            video.pause();
            video.currentTime = 0;
            setIsPlaying(false);
        }
    }, [playingFragmentId, playingSegment, videoUrl]);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        video.muted = muted;
    }, [muted]);

    // 下载当前分镜视频
    const handleDownloadVideo = useCallback(() => {
        if (!videoUrl) {
            return;
        }

        const link = document.createElement("a");

        link.href = videoUrl;
        link.download = "";
        link.rel = "noopener noreferrer";
        link.target = "_blank";
        link.click();
    }, [videoUrl]);

    // playheadLeft 播放指针横向位置百分比
    const playheadLeft = totalDuration > 0 ? (globalCurrentTime / totalDuration) * 100 : 0;

    return (
        <div className={cn("flex w-full flex-col gap-3", className)}>
            <div
                className={cn(
                    "relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-[#efeff4]",
                    !hasCurrentVideo && "border border-dashed border-slate-200",
                )}
            >
                {hasCurrentVideo ? (
                    <>
                        <video
                            ref={videoRef}
                            src={videoUrl ?? undefined}
                            poster={posterUrl ?? undefined}
                            playsInline
                            preload="auto"
                            className="size-full object-cover"
                        />
                        <button
                            type="button"
                            aria-label="下载视频"
                            onClick={handleDownloadVideo}
                            className="absolute right-3 top-3 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
                        >
                            <Download className="size-4" strokeWidth={1.8} />
                        </button>
                    </>
                ) : posterUrl ? (
                    <img
                        src={posterUrl}
                        alt="分镜预览"
                        className="size-full object-cover"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center px-4 text-center text-xs text-slate-400">
                        视频待生成
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <p className="text-center text-xs tabular-nums text-slate-500">
                    {formatVideoTimelineClock(globalCurrentTime)} /{" "}
                    {formatVideoTimelineClock(totalDuration)}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label={isPlaying ? "暂停" : "播放"}
                        disabled={!hasCurrentVideo}
                        onClick={handleTogglePlay}
                        className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center text-slate-900 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isPlaying ? (
                            <Pause className="size-4" strokeWidth={2} />
                        ) : (
                            <Play className="size-4" strokeWidth={2} />
                        )}
                    </button>

                    <div
                        ref={trackRef}
                        className={cn(
                            "relative flex h-3 min-w-0 flex-1 items-stretch overflow-hidden rounded-sm bg-[#ececf1]",
                            totalDuration > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                        )}
                        onPointerDown={(event) => {
                            if (totalDuration <= 0) {
                                return;
                            }

                            isSeekingRef.current = true;
                            seekByClientX(event.clientX);
                        }}
                        onPointerMove={(event) => {
                            if (totalDuration <= 0 || !isSeekingRef.current) {
                                return;
                            }

                            seekByClientX(event.clientX);
                        }}
                        onPointerUp={() => {
                            isSeekingRef.current = false;
                        }}
                        onPointerLeave={() => {
                            isSeekingRef.current = false;
                        }}
                    >
                        {timelineSegments.map((segment, index) => (
                            <div
                                key={segment.fragmentId}
                                className={cn(
                                    "relative min-w-0 bg-[#ececf1]",
                                    index < timelineSegments.length - 1 && "border-r border-white",
                                )}
                                style={{ flex: segment.durationSec }}
                            >
                                <div
                                    className="absolute inset-y-0 left-0 bg-black"
                                    style={{
                                        width: `${resolveEpisodeTimelineSegmentFillRatio(segment, globalCurrentTime) * 100}%`,
                                    }}
                                />
                            </div>
                        ))}

                        <div
                            className="pointer-events-none absolute top-[-3px] bottom-[-3px] w-px bg-violet-400"
                            style={{ left: `${playheadLeft}%` }}
                        />
                    </div>

                    <div className="relative shrink-0">
                        <button
                            type="button"
                            aria-label={autoLinkNext ? "关闭自动衔接下一片段" : "开启自动衔接下一片段"}
                            title={
                                autoLinkNext
                                    ? "关闭自动衔接下一片段"
                                    : "当前片段播放完后自动播放下一片段"
                            }
                            disabled={!hasAnyVideo}
                            onClick={() => setAutoLinkNext((value) => !value)}
                            className="inline-flex cursor-pointer flex-col items-center gap-1 text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <MonitorPlay className="size-4" strokeWidth={1.8} />
                            <span
                                className={cn(
                                    "h-1.5 w-5 rounded-full transition",
                                    autoLinkNext ? "bg-emerald-500" : "bg-[#d8d8de]",
                                )}
                            />
                        </button>
                    </div>

                    <button
                        type="button"
                        aria-label={muted ? "取消静音" : "静音"}
                        disabled={!hasCurrentVideo}
                        onClick={() => setMuted((value) => !value)}
                        className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {muted ? (
                            <VolumeX className="size-4" strokeWidth={1.8} />
                        ) : (
                            <Volume2 className="size-4" strokeWidth={1.8} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
