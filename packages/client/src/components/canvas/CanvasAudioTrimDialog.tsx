// 音频截取弹层：使用 WaveSurfer Regions 选择 2-5 秒片段
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/plugins/regions";
import TimelinePlugin from "wavesurfer.js/plugins/timeline";
import { Loader2, Pause, Play } from "lucide-react";
import {
    AUDIO_TRIM_MAX_SECONDS,
    AUDIO_TRIM_MIN_SECONDS,
    clampAudioTrimRange,
} from "@/lib/audioUpload";
import { cn } from "@/lib/utils";

type CanvasAudioTrimDialogProps = {
    file: File;
    durationSeconds: number;
    onCancel: () => void;
    onConfirm: (range: { start: number; end: number }) => void;
};

// WAVEFORM_MIN_PX_PER_SEC 波形最小缩放（像素/秒）
const WAVEFORM_MIN_PX_PER_SEC = 12;

// WAVEFORM_MAX_PX_PER_SEC 波形最大缩放（像素/秒）
const WAVEFORM_MAX_PX_PER_SEC = 400;

// WAVEFORM_DEFAULT_PX_PER_SEC 波形初始缩放（像素/秒）
const WAVEFORM_DEFAULT_PX_PER_SEC = 80;

// WAVEFORM_ZOOM_STEP 每次缩放步进
const WAVEFORM_ZOOM_STEP = 10;

// clampZoom 将缩放限制在允许范围内
function clampZoom(value: number) {
    return Math.max(WAVEFORM_MIN_PX_PER_SEC, Math.min(WAVEFORM_MAX_PX_PER_SEC, value));
}

// 计算适配容器宽度的缩放下限
function resolveFitZoom(containerWidth: number, durationSeconds: number) {
    return Math.max(WAVEFORM_MIN_PX_PER_SEC, Math.floor(containerWidth / Math.max(durationSeconds, 0.1)));
}

// 格式化选区时长文案
function formatSelectionLabel(start: number, end: number) {
    const length = end - start;

    return `已选 ${start.toFixed(1)}s - ${end.toFixed(1)}s（${length.toFixed(1)}s）`;
}

// 格式化时间轴刻度标签
function formatTimelineLabel(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// 渲染音频截取弹层
function CanvasAudioTrimDialogComponent({
    file,
    durationSeconds,
    onCancel,
    onConfirm,
}: CanvasAudioTrimDialogProps) {
    const scrollWrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollElementRef = useRef<HTMLElement | null>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionRef = useRef<ReturnType<RegionsPlugin["addRegion"]> | null>(null);
    const zoomLevelRef = useRef(WAVEFORM_DEFAULT_PX_PER_SEC);
    const isPlayingSelectionRef = useRef(false);
    // selectionResumeTimeRef 暂停时记录的播放位置，用于续播
    const selectionResumeTimeRef = useRef<number | null>(null);
    // selectionEndHandledRef 防止选区末尾重复触发停止逻辑
    const selectionEndHandledRef = useRef(false);
    const [ready, setReady] = useState(false);
    const [selectionLabel, setSelectionLabel] = useState("");
    const [isPlayingSelection, setIsPlayingSelection] = useState(false);

    // 阻止事件冒泡到 React Flow（仅 stopPropagation，不 preventDefault）
    const stopFlowPointer = useCallback((event: React.PointerEvent) => {
        event.stopPropagation();
    }, []);

    // 停止选区试听并清除续播位置
    const stopSelectionPlayback = useCallback(() => {
        wavesurferRef.current?.pause();
        selectionResumeTimeRef.current = null;
        isPlayingSelectionRef.current = false;
        setIsPlayingSelection(false);
    }, []);

    // 暂停选区试听并保留当前播放位置
    const pauseSelectionPlayback = useCallback(() => {
        const wavesurfer = wavesurferRef.current;

        // 暂停前先记录位置，避免 pause 事件后 stopAtPosition 被 WaveSurfer 清空导致状态丢失
        selectionResumeTimeRef.current = wavesurfer?.getCurrentTime() ?? 0;
        wavesurfer?.pause();
        isPlayingSelectionRef.current = false;
        setIsPlayingSelection(false);
    }, []);

    // 应用波形缩放
    const applyZoom = useCallback((nextZoom: number) => {
        const clampedZoom = clampZoom(nextZoom);

        zoomLevelRef.current = clampedZoom;
        wavesurferRef.current?.zoom(clampedZoom);
    }, []);

    // 判断当前时间是否可从中途续播
    const canResumeFromTime = useCallback((time: number, regionStart: number, regionEnd: number) => {
        return time >= regionStart + 0.01 && time < regionEnd - 0.02;
    }, []);

    // 解析本次播放起点：中途续播或从选区头重播
    const resolvePlayStart = useCallback(
        (regionStart: number, regionEnd: number) => {
            const resumeTime = selectionResumeTimeRef.current;

            if (resumeTime != null && canResumeFromTime(resumeTime, regionStart, regionEnd)) {
                return { start: resumeTime, shouldResume: true };
            }

            return { start: regionStart, shouldResume: false };
        },
        [canResumeFromTime],
    );

    // 播放选区内的音频（暂停后从当前位置续播，播完后从头重播）
    const playSelection = useCallback(() => {
        const wavesurfer = wavesurferRef.current;
        const region = regionRef.current;

        if (!wavesurfer || !region) {
            return;
        }

        const { start, shouldResume } = resolvePlayStart(region.start, region.end);

        if (!shouldResume) {
            selectionResumeTimeRef.current = null;
        }

        selectionEndHandledRef.current = false;
        isPlayingSelectionRef.current = true;
        setIsPlayingSelection(true);
        void wavesurfer.play(start, region.end).catch(() => {
            isPlayingSelectionRef.current = false;
            setIsPlayingSelection(false);
        });
    }, [resolvePlayStart]);

    // 播放或暂停选区内的音频
    const handleTogglePlaySelection = useCallback(() => {
        if (wavesurferRef.current?.isPlaying()) {
            pauseSelectionPlayback();
            return;
        }

        playSelection();
    }, [pauseSelectionPlayback, playSelection]);

    // 初始化 WaveSurfer 与默认可截取区域
    useEffect(() => {
        if (!containerRef.current || !scrollWrapperRef.current) {
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const regionsPlugin = RegionsPlugin.create();
        const timelinePlugin = TimelinePlugin.create({
            height: 22,
            formatTimeCallback: formatTimelineLabel,
            style: {
                fontSize: "11px",
                color: "#64748b",
            },
        });
        const initialRange = clampAudioTrimRange(0, AUDIO_TRIM_MAX_SECONDS, durationSeconds);
        const wrapperWidth = scrollWrapperRef.current.clientWidth;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            url: objectUrl,
            height: 96,
            waveColor: "#cbd5e1",
            progressColor: "#6366f1",
            cursorColor: "#6366f1",
            barWidth: 2,
            barGap: 2,
            barRadius: 2,
            fillParent: false,
            minPxPerSec: WAVEFORM_DEFAULT_PX_PER_SEC,
            dragToSeek: false,
            hideScrollbar: false,
            autoScroll: true,
            interact: false,
            plugins: [regionsPlugin, timelinePlugin],
        });

        wavesurferRef.current = wavesurfer;

        wavesurfer.on("ready", () => {
            const initialZoom = clampZoom(
                Math.max(WAVEFORM_DEFAULT_PX_PER_SEC, resolveFitZoom(wrapperWidth, durationSeconds)),
            );
            wavesurfer.zoom(initialZoom);
            zoomLevelRef.current = initialZoom;

            scrollElementRef.current =
                (wavesurfer.getWrapper().parentElement as HTMLElement | null) ??
                scrollWrapperRef.current;

            const region = regionsPlugin.addRegion({
                start: initialRange.start,
                end: initialRange.end,
                drag: true,
                resize: true,
                resizeStart: true,
                resizeEnd: true,
                minLength: AUDIO_TRIM_MIN_SECONDS,
                maxLength: AUDIO_TRIM_MAX_SECONDS,
                color: "rgba(99, 102, 241, 0.28)",
            });

            regionRef.current = region;
            setSelectionLabel(formatSelectionLabel(region.start, region.end));
            setReady(true);
        });

        wavesurfer.on("play", () => {
            isPlayingSelectionRef.current = true;
            setIsPlayingSelection(true);
        });

        wavesurfer.on("pause", () => {
            const region = regionRef.current;
            const currentTime = wavesurfer.getCurrentTime();
            const reachedSelectionEnd = Boolean(region && currentTime >= region.end - 0.02);

            // 选区末尾停止：仅处理一次，不再 seek（避免 setTime 触发 timeupdate 循环）
            if (reachedSelectionEnd && !selectionEndHandledRef.current) {
                selectionEndHandledRef.current = true;
                selectionResumeTimeRef.current = null;
            }

            isPlayingSelectionRef.current = false;
            setIsPlayingSelection(false);
        });

        wavesurfer.on("finish", () => {
            if (selectionEndHandledRef.current) {
                return;
            }

            selectionEndHandledRef.current = true;
            selectionResumeTimeRef.current = null;
            isPlayingSelectionRef.current = false;
            setIsPlayingSelection(false);
        });

        regionsPlugin.on("region-update", (region) => {
            stopSelectionPlayback();
            setSelectionLabel(formatSelectionLabel(region.start, region.end));
        });

        regionsPlugin.on("region-updated", (region) => {
            stopSelectionPlayback();

            const clamped = clampAudioTrimRange(region.start, region.end, durationSeconds);

            if (region.start !== clamped.start || region.end !== clamped.end) {
                region.setOptions({
                    start: clamped.start,
                    end: clamped.end,
                });
            }

            setSelectionLabel(formatSelectionLabel(clamped.start, clamped.end));
        });

        return () => {
            URL.revokeObjectURL(objectUrl);
            wavesurfer.destroy();
            wavesurferRef.current = null;
            regionRef.current = null;
            selectionResumeTimeRef.current = null;
            isPlayingSelectionRef.current = false;
            selectionEndHandledRef.current = false;
        };
    }, [durationSeconds, file, stopSelectionPlayback]);

    // 波形区域滚轮缩放与横向平移
    useEffect(() => {
        const wrapper = scrollWrapperRef.current;
        const scrollElement = scrollElementRef.current;

        if (!wrapper || !scrollElement || !ready) {
            return;
        }

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                scrollElement.scrollLeft += event.deltaX;
                return;
            }

            const delta = event.deltaY < 0 ? WAVEFORM_ZOOM_STEP : -WAVEFORM_ZOOM_STEP;
            applyZoom(zoomLevelRef.current + delta);
        };

        wrapper.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            wrapper.removeEventListener("wheel", handleWheel);
        };
    }, [applyZoom, ready]);

    // 确认截取区间
    const handleConfirm = () => {
        stopSelectionPlayback();

        const region = regionRef.current;

        if (!region) {
            return;
        }

        const clamped = clampAudioTrimRange(region.start, region.end, durationSeconds);
        onConfirm(clamped);
    };

    const dialogContent = (
        <div
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 p-4"
            onPointerDown={stopFlowPointer}
        >
            <div
                className="w-full max-w-[640px] rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
                onPointerDown={stopFlowPointer}
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-base font-semibold text-slate-900">截取音频片段</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {ready ? selectionLabel : "选择2-5秒的片段"}
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label={isPlayingSelection ? "暂停试听" : "播放选区"}
                        disabled={!ready}
                        onClick={handleTogglePlaySelection}
                        className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isPlayingSelection ? (
                            <Pause className="size-4" strokeWidth={2} />
                        ) : (
                            <Play className="ml-0.5 size-4" strokeWidth={2} />
                        )}
                    </button>
                </div>

                <div
                    ref={scrollWrapperRef}
                    className={cn(
                        "overflow-x-auto overflow-y-hidden rounded-xl bg-slate-50",
                        ready ? "" : "animate-pulse",
                    )}
                >
                    <div ref={containerRef} className="min-h-[118px]" />
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            stopSelectionPlayback();
                            onCancel();
                        }}
                        className="inline-flex h-9 cursor-pointer items-center rounded-full px-4 text-sm text-slate-600 transition hover:bg-slate-100"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        disabled={!ready}
                        onClick={handleConfirm}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-slate-900 px-4 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {ready ? null : <Loader2 className="size-4 animate-spin" />}
                        确认截取并上传
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(dialogContent, document.body);
}

export const CanvasAudioTrimDialog = memo(CanvasAudioTrimDialogComponent);
