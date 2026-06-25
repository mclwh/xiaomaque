// 画布节点卡片内容区：按类型渲染不同布局
import { memo, useRef, type MouseEvent } from "react";
import {
    AudioLines,
    Image as ImageIcon,
    Loader2,
    Play,
    UserRound,
    Landmark,
} from "lucide-react";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import { CANVAS_NODE_UI } from "@/components/canvas/canvasNodeConfig";
import { CanvasAssetMoreActionsPopover } from "@/components/canvas/nodes/CanvasAssetMoreActionsPopover";
import { CanvasCharacterBindAudioButton } from "@/components/canvas/nodes/CanvasCharacterBindAudioButton";
import { resolveStoragePreviewUrl, resolveStorageUrl } from "@/lib/storageUrl";
import { formatAssetSerieEpisodeLabel } from "@/lib/serieDisplay";
import {
    resolveCharacterAppearanceLabel,
    resolveCharacterNameLabel,
} from "@/lib/assetDisplay";
import { openMediaImagePreview, selectCanvasAssetById, selectCanvasSeries } from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { MediaAudioPlayer } from "@/components/ui/media-audio-player";
import { cn } from "@/lib/utils";

type CanvasNodeBodyProps = {
    assetId?: number;
    kind: CanvasNodeKind;
    label: string;
    mediaUrl?: string | null;
    isGenerating?: boolean;
};

// 根据节点类型返回占位图标
function CanvasNodePlaceholderIcon({ kind }: { kind: CanvasNodeKind }) {
    const iconClass = "size-10 text-slate-300";

    if (kind === "character") {
        return <UserRound className={iconClass} strokeWidth={1.4} />;
    }

    if (kind === "scene") {
        return <Landmark className={iconClass} strokeWidth={1.4} />;
    }

    if (kind === "text") {
        return null;
    }

    if (kind === "video") {
        return <Play className={iconClass} strokeWidth={1.4} />;
    }

    if (kind === "audio") {
        return <AudioLines className="size-8 text-slate-300" strokeWidth={1.4} />;
    }

    return <ImageIcon className={iconClass} strokeWidth={1.4} />;
}

// 渲染节点卡片内部内容
function CanvasNodeBodyComponent({
    assetId,
    kind,
    label,
    mediaUrl,
    isGenerating = false,
}: CanvasNodeBodyProps) {
    const dispatch = useAppDispatch();
    // cardRef 节点卡片容器，供编辑资料弹层定位
    const cardRef = useRef<HTMLDivElement>(null);
    const config = CANVAS_NODE_UI[kind];
    const previewUrl =
        kind === "audio" ? resolveStorageUrl(mediaUrl) : resolveStoragePreviewUrl(mediaUrl);
    const asset = useAppSelector((state) =>
        assetId ? selectCanvasAssetById(state, assetId) : null,
    );
    const series = useAppSelector(selectCanvasSeries);
    const characterNameLabel =
        kind === "character" && asset ? resolveCharacterNameLabel(asset) : "";
    const appearanceNameLabel =
        kind === "character" && asset
            ? resolveCharacterAppearanceLabel(asset, config.footerTitle)
            : "";
    const footerTitle =
        kind === "character"
            ? appearanceNameLabel
            : kind === "scene"
              ? label
              : config.footerTitle;
    const episodeLabel = formatAssetSerieEpisodeLabel(asset?.serieIds, series);

    // 双击打开全局图片预览并阻止触发画布交互
    const handleImagePreviewOpen = (event: MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!previewUrl) {
            return;
        }

        dispatch(
            openMediaImagePreview({
                src: previewUrl,
                alt: label,
            }),
        );
    };

    return (
        <div
            ref={cardRef}
            className={cn(
                "rounded-[20px] border border-black/5 bg-white shadow-sm",
                kind === "audio" ? "p-2" : "",
            )}
            style={{
                width: config.cardWidth,
                ...(kind === "audio" ? {} : { minHeight: config.cardMinHeight }),
            }}
        >
            <div
                className={cn(
                    "relative flex items-center justify-center overflow-hidden rounded-2xl bg-[#f0f0f2]",
                    kind === "audio" ? "w-full" : "mx-2 mt-2",
                    config.placeholderAspect,
                )}
            >
                {isGenerating ? (
                    <div className="flex size-full min-h-[120px] flex-col items-center justify-center gap-2 bg-[#f0f0f2]">
                        <Loader2 className="size-8 animate-spin text-violet-500" strokeWidth={1.8} />
                        <span className="text-xs text-slate-500">生成中...</span>
                    </div>
                ) : previewUrl ? (
                    kind === "audio" ? (
                        <div className="flex size-full min-h-[72px] items-center px-2">
                            <MediaAudioPlayer src={previewUrl} />
                        </div>
                    ) : (
                        <div
                            className="size-full"
                            onDoubleClick={handleImagePreviewOpen}
                        >
                            <img
                                src={previewUrl}
                                alt={label}
                                className="size-full object-cover"
                                draggable={false}
                                decoding="async"
                            />
                        </div>
                    )
                ) : (
                    <CanvasNodePlaceholderIcon kind={kind} />
                )}
            </div>

            {config.showFooter ? (
                <div className="relative px-3 pb-3 pt-2.5">
                    <div className={cn("flex items-start gap-1", kind === "character" ? "pr-14" : "pr-6")}>
                        {kind === "character" ? (
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-900">
                                    {characterNameLabel}
                                </p>
                                <p className="truncate text-xs text-slate-500">{appearanceNameLabel}</p>
                            </div>
                        ) : (
                            <span className="text-sm font-medium text-slate-900">{footerTitle}</span>
                        )}
                        {!previewUrl ? (
                            <span className="text-sm text-amber-600">待补充</span>
                        ) : null}
                    </div>
                    {config.showEpisode ? (
                        <p className="mt-0.5 text-xs text-slate-400">出现集数：{episodeLabel}</p>
                    ) : null}
                    <div className="nodrag nopan absolute right-2 bottom-2 flex items-center gap-0.5">
                        {kind === "character" && assetId ? (
                            <CanvasCharacterBindAudioButton characterAssetId={assetId} />
                        ) : null}
                        {assetId ? (
                            <CanvasAssetMoreActionsPopover
                                assetId={assetId}
                                kind={kind}
                                anchorRef={cardRef}
                            />
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export const CanvasNodeBody = memo(CanvasNodeBodyComponent);
