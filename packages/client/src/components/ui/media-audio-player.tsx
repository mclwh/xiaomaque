// 自定义音频播放器：播放/暂停与进度条，适用于画布节点等嵌入场景
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type MediaAudioPlayerProps = {
    src: string;
    className?: string;
};

// 渲染自定义音频播放器
function MediaAudioPlayerComponent({ src, className }: MediaAudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const isSeekingRef = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // 阻止事件冒泡到 React Flow
    const stopFlowEvent = useCallback((event: React.SyntheticEvent) => {
        event.stopPropagation();
    }, []);

    // 切换播放或暂停
    const handleTogglePlay = useCallback(() => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        if (audio.paused) {
            void audio.play();
            return;
        }

        audio.pause();
    }, []);

    // 拖动进度条时跳转播放位置
    const handleSeek = useCallback((values: number[]) => {
        const audio = audioRef.current;
        const nextTime = values[0] ?? 0;

        setCurrentTime(nextTime);

        if (audio) {
            audio.currentTime = nextTime;
        }
    }, []);

    // 绑定 audio 元素事件并在 src 变化时重置状态
    useEffect(() => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        audio.load();

        const handleTimeUpdate = () => {
            if (isSeekingRef.current) {
                return;
            }

            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        };

        const handleDurationChange = () => {
            setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        };

        const handlePlay = () => {
            setIsPlaying(true);
        };

        const handlePause = () => {
            setIsPlaying(false);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("durationchange", handleDurationChange);
        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("durationchange", handleDurationChange);
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [src]);

    // sliderMax 进度条最大值（无时长时占位为 1）
    const sliderMax = duration > 0 ? duration : 1;

    return (
        <div className={cn("flex w-full items-center gap-2.5", className)}>
            <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

            <button
                type="button"
                aria-label={isPlaying ? "暂停" : "播放"}
                onClick={handleTogglePlay}
                onMouseDown={stopFlowEvent}
                onPointerDown={stopFlowEvent}
                className="nodrag inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
            >
                {isPlaying ? (
                    <Pause className="size-3.5" strokeWidth={2} />
                ) : (
                    <Play className="ml-0.5 size-3.5" strokeWidth={2} />
                )}
            </button>

            <Slider
                className="nodrag flex-1"
                min={0}
                max={sliderMax}
                step={0.01}
                value={[Math.min(currentTime, sliderMax)]}
                disabled={duration <= 0}
                onValueChange={handleSeek}
                onMouseDown={stopFlowEvent}
                onPointerDown={(event) => {
                    isSeekingRef.current = true;
                    event.stopPropagation();
                }}
                onPointerUp={() => {
                    isSeekingRef.current = false;
                }}
                onPointerCancel={() => {
                    isSeekingRef.current = false;
                }}
            />
        </div>
    );
}

export const MediaAudioPlayer = memo(MediaAudioPlayerComponent);
