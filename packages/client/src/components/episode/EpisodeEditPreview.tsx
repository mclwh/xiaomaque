// 分集编辑页：中间分镜脚本编辑区
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EpisodeEditFragmentReferenceStrip } from "@/components/episode/EpisodeEditFragmentReferenceStrip";
import { EpisodeDurationChipPopover } from "@/components/episode/EpisodeDurationChipPopover";
import { EpisodeEditAssetMentionPopover } from "@/components/episode/EpisodeEditAssetMentionPopover";
import { useEpisodeEditAssets } from "@/hooks/useEpisodeEditAssets";
import type { EpisodeAssetScope } from "@/lib/episodeAssetSidebar";
import {
    resolveMentionChipFromAsset,
    resolveMentionChipFromItem,
    type EpisodeMentionAssetItem,
} from "@/lib/episodeMentionAssets";
import {
    detectMentionTriggerFromSelection,
    insertDurationChipAtRange,
    insertMentionChipAtRange,
    renderPromptEditorContent,
    serializePromptEditorContent,
    updateDurationChipElement,
} from "@/lib/episodePromptEditor";
import {
    sumFragmentContentDurationSeconds,
    validateFragmentContentDurationTotal,
} from "@/lib/episodeFragmentDuration";
import { resolveSerieFragmentDisplayLabel, type SerieFragment } from "@/lib/serieFragments";
import {
    appendSerieFragmentReference,
    resolveSerieFragmentReferenceNames,
    syncSerieFragmentReferenceWithContent,
    isSameSerieFragmentReferenceList,
} from "@/lib/serieFragmentReference";
import { getCaretClientRect, type MentionCaretRect } from "@/lib/promptMention";
import { resolveStorageUrl } from "@/lib/storageUrl";
import { cn } from "@/lib/utils";

type EpisodeEditPreviewProps = {
    projectId: number;
    serieId: number;
    fragment: SerieFragment | null;
    fragmentIndex?: number;
    isSaving?: boolean;
    onReferenceChange?: (reference: unknown[]) => void;
    onContentDraftChange?: (fragmentId: string, content: string) => void;
    onSave?: (
        fragmentId: string,
        payload: { content: string; reference: unknown[] },
    ) => Promise<void> | void;
    onSaveValidationError?: (message: string) => void;
    onGenerate?: () => void | Promise<void>;
    isGenerating?: boolean;
};

// FRAGMENT_CONTENT_PLACEHOLDER 无选中分镜时的占位文案
const FRAGMENT_CONTENT_PLACEHOLDER = "请先在底部分镜条选择镜头";

// FRAGMENT_CONTENT_EDIT_PLACEHOLDER 编辑区占位文案
const FRAGMENT_CONTENT_EDIT_PLACEHOLDER = "输入分镜脚本、画面描述或旁白...";

// FRAGMENT_EDITOR_HINT 编辑区标题旁提示文案
const FRAGMENT_EDITOR_HINT = "键入@可快速调整镜头时长、引用资产";

// GENERATE_CONFIRM_DESCRIPTION 生成二次确认说明
const GENERATE_CONFIRM_DESCRIPTION = "将基于当前分镜脚本生成视频。";

// EMPTY_FRAGMENT_REFERENCES 无分镜时的空引用列表
const EMPTY_FRAGMENT_REFERENCES: unknown[] = [];

type EpisodeEditPreviewActionBarProps = {
    isEditing: boolean;
    isSaving: boolean;
    isGenerating: boolean;
    disabled: boolean;
    generateConfirmDescription: string;
    onStartEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    onGenerate: () => void | Promise<void>;
};

// 渲染右下角悬浮操作按钮
function EpisodeEditPreviewActionBar({
    isEditing,
    isSaving,
    isGenerating,
    disabled,
    generateConfirmDescription,
    onStartEdit,
    onCancel,
    onSave,
    onGenerate,
}: EpisodeEditPreviewActionBarProps) {
    // generateConfirmOpen 生成二次确认弹窗是否打开
    const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);

    // handleGenerateConfirm 确认后触发生成
    const handleGenerateConfirm = useCallback(async () => {
        try {
            await onGenerate();
            setGenerateConfirmOpen(false);
        } catch {
            // 生成失败时保留弹窗，由上层 toast 提示
        }
    }, [onGenerate]);

    if (isEditing) {
        return (
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                <button
                    type="button"
                    disabled={isSaving}
                    onClick={onCancel}
                    className="inline-flex cursor-pointer items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    取消
                </button>
                <button
                    type="button"
                    disabled={isSaving}
                    onClick={onSave}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> : null}
                    保存
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={onStartEdit}
                    className="inline-flex cursor-pointer items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    编辑
                </button>
                <button
                    type="button"
                    disabled={disabled || isGenerating}
                    onClick={() => setGenerateConfirmOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> : null}
                    生成
                </button>
            </div>

            <ConfirmDialog
                open={generateConfirmOpen}
                title="确认生成视频？"
                description={generateConfirmDescription}
                confirmLabel="生成"
                confirming={isGenerating}
                onClose={() => setGenerateConfirmOpen(false)}
                onConfirm={handleGenerateConfirm}
            />
        </>
    );
}

// 渲染当前分镜脚本编辑区
export function EpisodeEditPreview({
    projectId,
    serieId,
    fragment,
    fragmentIndex = -1,
    isSaving = false,
    onReferenceChange,
    onContentDraftChange,
    onSave,
    onSaveValidationError,
    onGenerate,
    isGenerating = false,
}: EpisodeEditPreviewProps) {
    // editorRef 可编辑 div 引用
    const editorRef = useRef<HTMLDivElement>(null);
    // prevFragmentIdRef 上一次展示的分镜 ID
    const prevFragmentIdRef = useRef<string | null>(null);
    const { assets } = useEpisodeEditAssets(projectId);
    // isEditing 是否处于编辑模式
    const [isEditing, setIsEditing] = useState(false);
    // mentionOpen @ 引用弹窗是否打开
    const [mentionOpen, setMentionOpen] = useState(false);
    // mentionQuery @ 后的筛选关键词
    const [mentionQuery, setMentionQuery] = useState("");
    // mentionTriggerRangeRef @ 触发选区
    const mentionTriggerRangeRef = useRef<Range | null>(null);
    // editSessionReferencesRef 进入编辑时的 reference 快照
    const editSessionReferencesRef = useRef<unknown[]>([]);
    // mentionAnchorRect 弹窗锚点坐标
    const [mentionAnchorRect, setMentionAnchorRect] = useState<MentionCaretRect | null>(null);
    // mentionScope 资产范围：本集 / 全剧
    const [mentionScope, setMentionScope] = useState<EpisodeAssetScope>("episode");
    // mentionActiveIndex 列表高亮索引
    const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
    // mentionItemsCount 可引用项数量
    const [mentionItemsCount, setMentionItemsCount] = useState(0);
    // durationEditOpen 时长标签编辑弹层是否打开
    const [durationEditOpen, setDurationEditOpen] = useState(false);
    // durationEditAnchorRect 时长标签弹层锚点
    const [durationEditAnchorRect, setDurationEditAnchorRect] = useState<MentionCaretRect | null>(null);
    // durationEditSeconds 正在编辑的时长秒数
    const [durationEditSeconds, setDurationEditSeconds] = useState(0);
    // durationEditChipRef 正在编辑的时长标签 DOM
    const durationEditChipRef = useRef<HTMLElement | null>(null);
    // fragmentContent 当前分镜脚本（含本地草稿）
    const fragmentContent = fragment?.content ?? "";
    // fragmentReferences 当前分镜引用（含本地草稿）
    const fragmentReferences = fragment?.reference ?? EMPTY_FRAGMENT_REFERENCES;

    // 根据资产 ID 解析引用标签展示数据
    const resolveChipByAssetId = useCallback(
        (assetId: number) => {
            const asset = assets.find((item) => item.id === assetId);

            if (!asset) {
                return null;
            }

            return resolveMentionChipFromAsset(asset);
        },
        [assets],
    );

    // 将已保存内容渲染到编辑器（含 inline 引用标签）
    const renderEditorContent = useCallback(
        (content: string) => {
            if (!editorRef.current) {
                return;
            }

            renderPromptEditorContent(editorRef.current, content, resolveChipByAssetId);
        },
        [resolveChipByAssetId],
    );

    // 读取编辑器当前可序列化 content
    const getEditorContent = useCallback(() => {
        return editorRef.current
            ? serializePromptEditorContent(editorRef.current)
            : fragmentContent;
    }, [fragmentContent]);

    // 展示时长校验失败 toast（委托页面层统一展示）
    const handleDurationValidationError = useCallback(
        (message: string) => {
            onSaveValidationError?.(message);
        },
        [onSaveValidationError],
    );

    // 关闭 @ 引用弹窗
    const closeMentionPopover = useCallback(() => {
        setMentionOpen(false);
        setMentionQuery("");
        setMentionActiveIndex(0);
        setMentionScope("episode");
        mentionTriggerRangeRef.current = null;
    }, []);

    // 关闭时长标签编辑弹层
    const closeDurationEditPopover = useCallback(() => {
        setDurationEditOpen(false);
        setDurationEditAnchorRect(null);
        durationEditChipRef.current = null;
    }, []);

    // 切换分镜或退出编辑态时同步编辑器内容
    useEffect(() => {
        const editor = editorRef.current;
        const nextFragmentId = fragment?.id ?? null;
        const prevFragmentId = prevFragmentIdRef.current;
        const fragmentChanged = prevFragmentId !== nextFragmentId;

        if (editor && prevFragmentId && fragmentChanged) {
            onContentDraftChange?.(
                prevFragmentId,
                serializePromptEditorContent(editor),
            );
        }

        prevFragmentIdRef.current = nextFragmentId;

        if (!editor || !nextFragmentId) {
            return;
        }

        if (fragmentChanged) {
            setIsEditing(false);
            closeMentionPopover();
            closeDurationEditPopover();
            editSessionReferencesRef.current = [...fragmentReferences];
            renderEditorContent(fragmentContent);
            return;
        }

        if (!isEditing) {
            renderEditorContent(fragmentContent);
        }
    }, [
        closeDurationEditPopover,
        closeMentionPopover,
        fragmentContent,
        fragment?.id,
        isEditing,
        onContentDraftChange,
        renderEditorContent,
    ]);

    // 同步 @ 触发状态
    const syncMentionTrigger = useCallback(() => {
        const editor = editorRef.current;

        if (!editor || !isEditing) {
            closeMentionPopover();
            return;
        }

        const trigger = detectMentionTriggerFromSelection(editor);
        const caretRect = getCaretClientRect(editor);

        if (!trigger || !caretRect) {
            closeMentionPopover();
            return;
        }

        mentionTriggerRangeRef.current = trigger.range;
        setMentionOpen(true);
        setMentionQuery(trigger.query);
        setMentionAnchorRect(caretRect);
        setMentionActiveIndex(0);
    }, [closeMentionPopover, isEditing]);

    // 进入编辑模式并聚焦编辑器
    const handleStartEdit = useCallback(() => {
        if (!fragment || !editorRef.current) {
            return;
        }

        editSessionReferencesRef.current = [...fragmentReferences];
        renderEditorContent(fragmentContent);
        setIsEditing(true);

        requestAnimationFrame(() => {
            editorRef.current?.focus();
        });
    }, [fragment, fragmentContent, fragmentReferences, renderEditorContent]);

    // 取消编辑并恢复已保存内容
    const handleCancel = useCallback(() => {
        onReferenceChange?.([...editSessionReferencesRef.current]);
        renderEditorContent(fragmentContent);
        closeMentionPopover();
        closeDurationEditPopover();
        setIsEditing(false);
    }, [closeDurationEditPopover, closeMentionPopover, fragmentContent, onReferenceChange, renderEditorContent]);

    // 保存当前分镜脚本
    const handleSave = useCallback(async () => {
        if (!fragment || isSaving) {
            return;
        }

        const content = editorRef.current ? serializePromptEditorContent(editorRef.current) : "";
        const durationValidation = validateFragmentContentDurationTotal(content);

        if (!durationValidation.valid) {
            onSaveValidationError?.(durationValidation.message ?? "镜头时长校验失败");
            return;
        }

        const reference = syncSerieFragmentReferenceWithContent(fragmentReferences, content, assets);

        try {
            await onSave?.(fragment.id, { content, reference });
            closeMentionPopover();
            closeDurationEditPopover();
            setIsEditing(false);
        } catch {
            // 保存失败时保持编辑态，错误提示由页面层处理
        }
    }, [assets, closeDurationEditPopover, closeMentionPopover, fragment, fragmentReferences, isSaving, onSave, onSaveValidationError]);

    // 选中时长并插入 inline 标签
    const handleDurationSelect = useCallback(
        (seconds: number) => {
            const editor = editorRef.current;
            const triggerRange = mentionTriggerRangeRef.current;

            if (!editor || !triggerRange) {
                return;
            }

            insertDurationChipAtRange(triggerRange, seconds);
            mentionTriggerRangeRef.current = null;
            closeMentionPopover();
            editor.focus();
        },
        [closeMentionPopover],
    );

    // 点击已有 inline 时长标签时打开编辑弹层
    const handleDurationChipClick = useCallback(
        (chip: HTMLElement) => {
            const seconds = Number(chip.dataset.durationSec);

            if (!Number.isFinite(seconds) || seconds <= 0) {
                return;
            }

            closeMentionPopover();
            durationEditChipRef.current = chip;
            setDurationEditSeconds(seconds);

            const rect = chip.getBoundingClientRect();
            setDurationEditAnchorRect({
                top: rect.top,
                left: rect.left,
                bottom: rect.bottom,
            });
            setDurationEditOpen(true);
        },
        [closeMentionPopover],
    );

    // 更新已有时长标签秒数
    const handleDurationChipUpdate = useCallback(
        (seconds: number) => {
            const chip = durationEditChipRef.current;

            if (!chip) {
                return;
            }

            updateDurationChipElement(chip, seconds);
            closeDurationEditPopover();
            editorRef.current?.focus();
        },
        [closeDurationEditPopover],
    );

    // 选中 @ 引用项并插入 inline 标签
    const handleMentionSelect = useCallback(
        (item: EpisodeMentionAssetItem) => {
            const editor = editorRef.current;
            const triggerRange = mentionTriggerRangeRef.current;

            if (!editor || !triggerRange) {
                return;
            }

            insertMentionChipAtRange(triggerRange, resolveMentionChipFromItem(item));
            onReferenceChange?.(
                appendSerieFragmentReference(fragmentReferences, item.asset.id, {
                    url:
                        resolveStorageUrl(item.asset.url) ??
                        item.previewUrl ??
                        resolveStorageUrl(item.asset.cover) ??
                        undefined,
                    type: item.asset.type,
                    ...resolveSerieFragmentReferenceNames(item.asset),
                }),
            );
            mentionTriggerRangeRef.current = null;
            closeMentionPopover();
            editor.focus();
        },
        [closeMentionPopover, fragmentReferences, onReferenceChange],
    );

    // 根据编辑器内容同步 reference（删除 inline 标签时移除对应项）
    const syncReferencesFromEditor = useCallback(() => {
        const editor = editorRef.current;

        if (!editor || !onReferenceChange) {
            return;
        }

        const content = serializePromptEditorContent(editor);
        const nextReference = syncSerieFragmentReferenceWithContent(
            fragmentReferences,
            content,
            assets,
        );

        if (!isSameSerieFragmentReferenceList(fragmentReferences, nextReference)) {
            onReferenceChange(nextReference);
        }
    }, [assets, fragmentReferences, onReferenceChange]);

    // 阻止事件冒泡，避免触发画布类全局快捷键
    const handleEditorMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    const handleEditorInput = () => {
        closeDurationEditPopover();
        syncMentionTrigger();
        syncReferencesFromEditor();
    };

    // 双击编辑器进入编辑模式
    const handleEditorDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();

        if (!fragment || isEditing || isSaving) {
            return;
        }

        event.preventDefault();
        handleStartEdit();
    };

    const handleEditorClick = (event: MouseEvent<HTMLDivElement>) => {
        if (!isEditing) {
            return;
        }

        // contentEditable=false 的内联 chip 被点击时，event.target 常为外层可编辑容器，
        // 先按 target 查找，未命中再用点击坐标命中 chip
        let chip = (event.target as HTMLElement).closest<HTMLElement>("[data-duration-sec]");

        if (!chip) {
            const pointEl = document.elementFromPoint(
                event.clientX,
                event.clientY,
            ) as HTMLElement | null;
            chip = pointEl?.closest<HTMLElement>("[data-duration-sec]") ?? null;
        }

        if (chip && editorRef.current?.contains(chip)) {
            event.preventDefault();
            handleDurationChipClick(chip);
            return;
        }

        syncMentionTrigger();
    };

    const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        event.stopPropagation();

        if (!mentionOpen) {
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            closeMentionPopover();
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setMentionActiveIndex((current) =>
                Math.min(current + 1, Math.max(mentionItemsCount - 1, 0)),
            );
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setMentionActiveIndex((current) => Math.max(current - 1, 0));
        }
    };

    // contentDurationTotal 当前脚本已用时长合计
    const contentDurationTotal = sumFragmentContentDurationSeconds(
        durationEditOpen || mentionOpen ? getEditorContent() : fragmentContent,
    );

    // fragmentLabel 当前分镜展示标签
    const fragmentLabel =
        fragment && fragmentIndex >= 0
            ? resolveSerieFragmentDisplayLabel(fragment, fragmentIndex)
            : "选择分镜";

    // generateConfirmDescription 生成二次确认文案
    const generateConfirmDescription =
        fragment && fragmentIndex >= 0
            ? `将为「${fragmentLabel}」生成视频。`
            : GENERATE_CONFIRM_DESCRIPTION;

    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#ececf1] p-4 md:p-6">
            <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
                <p className="min-w-0 truncate text-base font-semibold text-slate-900">
                    {fragmentLabel}
                </p>
                <p className="shrink-0 truncate text-xs text-slate-500">{FRAGMENT_EDITOR_HINT}</p>
            </div>

            <EpisodeEditFragmentReferenceStrip references={fragmentReferences} assets={assets} />

            <div className="relative flex min-h-0 flex-1 items-stretch">
                <div
                    ref={editorRef}
                    role="textbox"
                    aria-multiline="true"
                    aria-label="分镜脚本"
                    aria-readonly={!isEditing}
                    contentEditable={Boolean(fragment) && isEditing}
                    suppressContentEditableWarning
                    data-placeholder={
                        fragment ? FRAGMENT_CONTENT_EDIT_PLACEHOLDER : FRAGMENT_CONTENT_PLACEHOLDER
                    }
                    onMouseDown={handleEditorMouseDown}
                    onDoubleClick={handleEditorDoubleClick}
                    onInput={handleEditorInput}
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={syncMentionTrigger}
                    onClick={handleEditorClick}
                    className={cn(
                        "xyq-prompt-editor min-h-0 w-full flex-1 overflow-y-auto rounded-[24px] border border-black/5 bg-white px-5 py-4 pb-14 text-sm leading-7 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] outline-none transition wrap-break-word whitespace-pre-wrap",
                        isEditing && "focus:border-slate-300 focus:ring-2 focus:ring-black/5",
                        isEditing &&
                            "[&_[data-duration-sec]]:cursor-pointer [&_[data-duration-sec]]:transition-colors [&_[data-duration-sec]]:hover:bg-[#e4e4ea] [&_[data-mention-thumb]]:cursor-zoom-in",
                        !fragment && "cursor-not-allowed bg-[#dedee4] text-slate-500",
                        fragment && !isEditing && "cursor-text",
                    )}
                />

                <EpisodeEditPreviewActionBar
                    isEditing={isEditing}
                    isSaving={isSaving}
                    isGenerating={isGenerating}
                    disabled={!fragment}
                    generateConfirmDescription={generateConfirmDescription}
                    onStartEdit={handleStartEdit}
                    onCancel={handleCancel}
                    onSave={() => {
                        void handleSave();
                    }}
                    onGenerate={async () => {
                        await onGenerate?.();
                    }}
                />

                <EpisodeEditAssetMentionPopover
                    open={mentionOpen}
                    projectId={projectId}
                    serieId={serieId}
                    query={mentionQuery}
                    scope={mentionScope}
                    anchorRect={mentionAnchorRect}
                    activeIndex={mentionActiveIndex}
                    contentDurationTotal={contentDurationTotal}
                    onScopeChange={setMentionScope}
                    onActiveIndexChange={setMentionActiveIndex}
                    onItemsCountChange={setMentionItemsCount}
                    onSelect={handleMentionSelect}
                    onSelectDuration={handleDurationSelect}
                    onClose={closeMentionPopover}
                    onValidationError={handleDurationValidationError}
                />

                <EpisodeDurationChipPopover
                    open={durationEditOpen}
                    anchorRect={durationEditAnchorRect}
                    currentSeconds={durationEditSeconds}
                    getEditorContent={getEditorContent}
                    onSelect={handleDurationChipUpdate}
                    onClose={closeDurationEditPopover}
                    onValidationError={handleDurationValidationError}
                />
            </div>
        </section>
    );
}
