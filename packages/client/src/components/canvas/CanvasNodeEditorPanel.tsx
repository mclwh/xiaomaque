// 节点选中时悬浮在节点底部的 AI 生成编辑面板（由 NodeToolbar 定位）
import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import {
    ArrowUp,
    AtSign,
    Loader2,
    Maximize2,
    Plus,
    Sparkles,
} from "lucide-react";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import { CanvasAudioReferenceFiles } from "@/components/canvas/CanvasAudioReferenceFiles";
import { CanvasReferenceChip } from "@/components/canvas/CanvasReferenceChip";
import {
    CANVAS_NODE_EDITOR_PANEL_HEIGHT,
    CANVAS_NODE_EDITOR_PANEL_WIDTH,
} from "@/components/canvas/canvasNodeConfig";
import { ModelSelectPopover } from "@/components/prompt/ModelSelectPopover";
import { ImageStylePopover } from "@/components/prompt/ImageStylePopover";
import { OutputSettingsPopover } from "@/components/prompt/OutputSettingsPopover";
import { VideoDurationPopover } from "@/components/prompt/VideoDurationPopover";
import { VideoResolutionPopover } from "@/components/prompt/VideoResolutionPopover";
import { VideoSeedPopover } from "@/components/prompt/VideoSeedPopover";
import type { ImageGenerationModelId } from "@/api/generation";
import {
    IMAGE_GENERATION_MODELS,
    type GenerationAspectRatioId,
    type GenerationResolution,
} from "@/lib/generationOptions";
import {
    readAssetGenerationSettings,
    resolveSavedAspectRatio,
    resolveSavedImageModelId,
    resolveSavedImageStyle,
    resolveSavedResolution,
} from "@/lib/canvasGeneration";
import type { ImageStyleId } from "@/lib/imageStyles";
import {
    resolveReferenceSourceAssetId,
    resolveReferenceSourceDisplay,
} from "@/lib/canvasGroup";
import {
    canGenerateImageOnCanvas,
    getGenerationMediaTypeFromNodeKind,
    isAudioCanvasNode,
} from "@/lib/generationMediaType";
import {
    clearCanvasAssetReference,
    generateCanvasImage,
    pushCanvasHistorySnapshot,
    selectIsAssetGenerating,
    selectCanvasAssetById,
    selectCanvasAssetsList,
} from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

type CanvasNodeEditorPanelProps = {
    assetId: number;
    kind: CanvasNodeKind;
};

// 画布编辑面板提示词占位文案
const IMAGE_PROMPT_PLACEHOLDER = "描述你想要生成的画面内容，@引用素材";
const AUDIO_PROMPT_PLACEHOLDER = "暂不支持文本音色设计";

// 渲染选中节点对应的底部编辑面板内容
function CanvasNodeEditorPanelComponent({ assetId, kind }: CanvasNodeEditorPanelProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();
    const mediaType = getGenerationMediaTypeFromNodeKind(kind);
    const isVideoNode = mediaType === "video";
    const isAudioNode = isAudioCanvasNode(kind);
    const canGenerateImage = canGenerateImageOnCanvas(kind);
    const showModelAndOutputControls = canGenerateImage || isVideoNode;
    const showSubmitButton = canGenerateImage || isAudioNode;
    const generating = useAppSelector(selectIsAssetGenerating(assetId));
    const currentAsset = useAppSelector((state) => selectCanvasAssetById(state, assetId));
    const assets = useAppSelector(selectCanvasAssetsList);
    const referenceSource = useMemo(
        () => (isAudioNode ? null : resolveReferenceSourceDisplay(assets, currentAsset)),
        [assets, currentAsset, isAudioNode],
    );
    const savedGeneration = useMemo(
        () => readAssetGenerationSettings(currentAsset?.params),
        [currentAsset?.params],
    );
    const [prompt, setPrompt] = useState("");
    const [modelId, setModelId] = useState<ImageGenerationModelId>(
        IMAGE_GENERATION_MODELS[0]?.id as ImageGenerationModelId,
    );
    const [aspectRatio, setAspectRatio] = useState<GenerationAspectRatioId>("auto");
    const [resolution, setResolution] = useState<GenerationResolution>("3K");
    const [imageStyleId, setImageStyleId] = useState<ImageStyleId | undefined>(undefined);
    const canSubmit = !isAudioNode && showSubmitButton && prompt.trim().length > 0 && !generating;
    const promptPlaceholder = isAudioNode ? AUDIO_PROMPT_PLACEHOLDER : IMAGE_PROMPT_PLACEHOLDER;

    // 切换节点时恢复上次保存的生图参数
    useEffect(() => {
        if (isAudioNode) {
            setPrompt("");
            if (editorRef.current) {
                editorRef.current.textContent = "";
            }
            return;
        }

        const nextPrompt = savedGeneration?.prompt ?? "";

        if (!savedGeneration) {
            setPrompt("");
            setModelId(IMAGE_GENERATION_MODELS[0]?.id as ImageGenerationModelId);
            setAspectRatio("auto");
            setResolution("3K");
            setImageStyleId(undefined);
        } else {
            setPrompt(nextPrompt);
            setModelId(resolveSavedImageModelId(savedGeneration.modelId) as ImageGenerationModelId);
            setAspectRatio(resolveSavedAspectRatio(savedGeneration.aspectRatio));
            setResolution(resolveSavedResolution(savedGeneration.resolution));
            setImageStyleId(resolveSavedImageStyle(savedGeneration.imageStyleId));
        }

        if (editorRef.current) {
            editorRef.current.textContent = nextPrompt;
        }
    }, [assetId, isAudioNode, savedGeneration]);

    // 同步 contentEditable 文本到 state
    const handlePromptInput = () => {
        setPrompt(editorRef.current?.textContent ?? "");
    };

    // 阻止画布拖拽与快捷键捕获
    const handleEditorMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    // 提交生图或音频提示词
    const handleSubmit = useCallback(() => {
        if (!canSubmit) {
            return;
        }

        dispatch(pushCanvasHistorySnapshot());

        void dispatch(
            generateCanvasImage({
                assetId,
                prompt: prompt.trim(),
                modelId,
                aspectRatio,
                resolution,
                imageStyleId,
            }),
        );
    }, [
        aspectRatio,
        assetId,
        canSubmit,
        dispatch,
        imageStyleId,
        modelId,
        prompt,
        resolution,
    ]);

    // 移除当前节点的直接引用来源
    const handleRemoveReference = useCallback(() => {
        if (!resolveReferenceSourceAssetId(currentAsset)) {
            return;
        }

        dispatch(pushCanvasHistorySnapshot());
        void dispatch(clearCanvasAssetReference(assetId));
    }, [assetId, currentAsset, dispatch]);

    return (
        <div
            className="nodrag nopan pointer-events-auto flex flex-col rounded-[28px] border border-black/5 bg-white/95 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur"
            style={{
                width: `min(${CANVAS_NODE_EDITOR_PANEL_WIDTH}px, calc(100vw - 48px))`,
                height: CANVAS_NODE_EDITOR_PANEL_HEIGHT,
            }}
        >
            {referenceSource ? (
                <div className="mb-2 flex shrink-0 flex-wrap items-center gap-2">
                    <CanvasReferenceChip
                        src={referenceSource.imageUrl}
                        alt={referenceSource.asset.name ?? "引用素材"}
                        onRemove={handleRemoveReference}
                    />
                </div>
            ) : null}
            <div className="mb-3 flex min-h-0 flex-1 items-start gap-3">
                <div
                    ref={editorRef}
                    role="textbox"
                    aria-multiline="true"
                    aria-label={isAudioNode ? "音频生成提示词" : "生成提示词"}
                    aria-disabled={isAudioNode}
                    contentEditable={!isAudioNode}
                    suppressContentEditableWarning
                    data-placeholder={promptPlaceholder}
                    className={cn(
                        "nodrag nowheel xyq-prompt-editor min-h-0 w-full flex-1 overflow-y-auto border-0 bg-transparent text-sm leading-6 text-slate-900 outline-none wrap-break-word whitespace-pre-wrap",
                        isAudioNode ? "cursor-not-allowed text-slate-400" : "",
                    )}
                    onInput={isAudioNode ? undefined : handlePromptInput}
                    onMouseDown={handleEditorMouseDown}
                    onKeyDown={isAudioNode ? undefined : handleEditorKeyDown}
                />
                <button
                    type="button"
                    aria-label="展开"
                    className="nodrag inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                    <Maximize2 className="size-4" strokeWidth={1.8} />
                </button>
            </div>

            <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                    {isAudioNode ? (
                        <CanvasAudioReferenceFiles assetId={assetId} variant="upload-button" />
                    ) : (
                        <>
                            <button
                                type="button"
                                aria-label="添加"
                                className="nodrag inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
                            >
                                <Plus className="size-4" strokeWidth={1.8} />
                            </button>
                            <button
                                type="button"
                                aria-label="引用"
                                className="nodrag inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
                            >
                                <AtSign className="size-4" strokeWidth={1.8} />
                            </button>
                            {canGenerateImage ? (
                                <ImageStylePopover
                                    interactionScope="canvas"
                                    value={imageStyleId}
                                    onValueChange={setImageStyleId}
                                />
                            ) : null}
                            {showModelAndOutputControls ? (
                                <>
                                    <ModelSelectPopover
                                        mediaType={mediaType}
                                        interactionScope="canvas"
                                        value={modelId}
                                        onValueChange={(nextModelId) =>
                                            setModelId(nextModelId as ImageGenerationModelId)
                                        }
                                    />
                                    <OutputSettingsPopover
                                        mediaType={mediaType}
                                        interactionScope="canvas"
                                        aspectRatio={aspectRatio}
                                        resolution={resolution}
                                        onAspectRatioChange={(nextAspectRatio) =>
                                            setAspectRatio(nextAspectRatio as GenerationAspectRatioId)
                                        }
                                        onResolutionChange={setResolution}
                                    />
                                </>
                            ) : null}
                            {isVideoNode ? (
                                <>
                                    <VideoResolutionPopover interactionScope="canvas" />
                                    <VideoDurationPopover interactionScope="canvas" />
                                    <VideoSeedPopover interactionScope="canvas" />
                                </>
                            ) : null}
                        </>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {!isAudioNode ? (
                        <button
                            type="button"
                            aria-label="AI 润色"
                            className="nodrag inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
                        >
                            <Sparkles className="size-4 text-violet-500" strokeWidth={1.8} />
                        </button>
                    ) : null}
                    {showSubmitButton ? (
                        <button
                            type="button"
                            aria-label={isAudioNode ? "提交" : "生成"}
                            disabled={isAudioNode || !canSubmit}
                            onClick={handleSubmit}
                            className="nodrag inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {generating ? (
                                <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                            ) : (
                                <ArrowUp className="size-4" strokeWidth={2} />
                            )}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export const CanvasNodeEditorPanel = memo(CanvasNodeEditorPanelComponent);
