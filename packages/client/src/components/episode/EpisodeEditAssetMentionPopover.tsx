// 分集编辑页：@ 引用资产与小工具弹窗
import {
    Briefcase,
    ChevronRight,
    LayoutGrid,
    Timer,
    User,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEpisodeEditAssets } from "@/hooks/useEpisodeEditAssets";
import type { EpisodeAssetScope } from "@/lib/episodeAssetSidebar";
import {
    FRAGMENT_CONTENT_DURATION_MAX,
    FRAGMENT_DURATION_PRESET_OPTIONS,
    resolveFragmentDurationAddError,
} from "@/lib/episodeFragmentDuration";
import {
    buildEpisodeMentionAssetItems,
    type EpisodeMentionAssetItem,
} from "@/lib/episodeMentionAssets";
import type { MentionCaretRect } from "@/lib/promptMention";
import { cn } from "@/lib/utils";

// EpisodeMentionPopoverTab 弹窗 Tab
type EpisodeMentionPopoverTab = "assets" | "tools";

// EpisodeMentionToolsView 小工具子视图
type EpisodeMentionToolsView = "list" | "duration";

type EpisodeEditAssetMentionPopoverProps = {
    open: boolean;
    projectId: number;
    serieId: number;
    query: string;
    scope: EpisodeAssetScope;
    anchorRect: MentionCaretRect | null;
    activeIndex: number;
    contentDurationTotal: number;
    onScopeChange: (scope: EpisodeAssetScope) => void;
    onActiveIndexChange: (index: number) => void;
    onItemsCountChange?: (count: number) => void;
    onSelect: (item: EpisodeMentionAssetItem) => void;
    onSelectDuration: (seconds: number) => void;
    onClose: () => void;
    onValidationError?: (message: string) => void;
};

type EpisodeMentionListItemProps = {
    item: EpisodeMentionAssetItem;
    isActive: boolean;
    onSelect: () => void;
    onHover: () => void;
};

// 渲染 @ 引用列表单项
function EpisodeMentionListItem({
    item,
    isActive,
    onSelect,
    onHover,
}: EpisodeMentionListItemProps) {
    return (
        <button
            type="button"
            className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-left transition",
                isActive ? "bg-[#efeff4]" : "hover:bg-[#f3f3f7]",
            )}
            onMouseDown={(event) => {
                event.preventDefault();
            }}
            onMouseEnter={onHover}
            onClick={onSelect}
        >
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#efeff4]">
                {item.previewUrl ? (
                    <img
                        src={item.previewUrl}
                        alt={item.primaryLabel}
                        className="size-full object-cover"
                    />
                ) : (
                    <User className="size-4 text-slate-400" strokeWidth={1.6} />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-800">{item.primaryLabel}</p>
                {item.secondaryLabel ? (
                    <p className="truncate text-xs text-slate-500">{item.secondaryLabel}</p>
                ) : null}
            </div>
        </button>
    );
}

// 渲染 @ 引用资产与小工具弹窗
function EpisodeEditAssetMentionPopoverComponent({
    open,
    projectId,
    serieId,
    query,
    scope,
    anchorRect,
    activeIndex,
    contentDurationTotal,
    onScopeChange,
    onActiveIndexChange,
    onItemsCountChange,
    onSelect,
    onSelectDuration,
    onClose,
    onValidationError,
}: EpisodeEditAssetMentionPopoverProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const { assets, loading } = useEpisodeEditAssets(projectId);
    // activeTab 当前 Tab
    const [activeTab, setActiveTab] = useState<EpisodeMentionPopoverTab>("assets");
    // toolsView 小工具子视图
    const [toolsView, setToolsView] = useState<EpisodeMentionToolsView>("list");
    // customDuration 自定义时长输入
    const [customDuration, setCustomDuration] = useState("");

    // mentionItems 可引用资产列表
    const mentionItems = useMemo(
        () => buildEpisodeMentionAssetItems(assets, serieId, scope, query),
        [assets, query, scope, serieId],
    );

    // previewItem 右侧预览项
    const previewItem = mentionItems[activeIndex] ?? mentionItems[0] ?? null;

    // groupedItems 按分类分组后的列表
    const groupedItems = useMemo(() => {
        const groups = new Map<string, { label: string; items: EpisodeMentionAssetItem[] }>();

        mentionItems.forEach((item) => {
            const existing = groups.get(item.sectionLabel);

            if (existing) {
                existing.items.push(item);
                return;
            }

            groups.set(item.sectionLabel, {
                label: item.sectionLabel,
                items: [item],
            });
        });

        return Array.from(groups.values());
    }, [mentionItems]);

    // navigableItemCount 当前视图可键盘导航的项数
    const navigableItemCount = useMemo(() => {
        if (activeTab === "assets") {
            return mentionItems.length;
        }

        if (toolsView === "duration") {
            return FRAGMENT_DURATION_PRESET_OPTIONS.length + 1;
        }

        return 1;
    }, [activeTab, mentionItems.length, toolsView]);

    useEffect(() => {
        if (!open) {
            setActiveTab("assets");
            setToolsView("list");
            setCustomDuration("");
        }
    }, [open]);

    useEffect(() => {
        onItemsCountChange?.(navigableItemCount);
    }, [navigableItemCount, onItemsCountChange]);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (activeIndex >= navigableItemCount) {
            onActiveIndexChange(Math.max(navigableItemCount - 1, 0));
        }
    }, [activeIndex, navigableItemCount, onActiveIndexChange, open]);

    // 判断新增时长后是否超过上限
    const canAddDuration = useCallback(
        (seconds: number) => contentDurationTotal + seconds <= FRAGMENT_CONTENT_DURATION_MAX,
        [contentDurationTotal],
    );

    // 选中预设或自定义时长并插入标签
    const handleSelectDurationSeconds = useCallback(
        (seconds: number) => {
            const errorMessage = resolveFragmentDurationAddError(contentDurationTotal, seconds);

            if (errorMessage) {
                onValidationError?.(errorMessage);
                return;
            }

            onSelectDuration(seconds);
        },
        [contentDurationTotal, onSelectDuration, onValidationError],
    );

    // 确认自定义时长输入
    const handleConfirmCustomDuration = useCallback(() => {
        const seconds = Number(customDuration.trim());
        handleSelectDurationSeconds(seconds);
    }, [customDuration, handleSelectDurationSeconds]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            if (activeTab === "assets" && mentionItems[activeIndex]) {
                onSelect(mentionItems[activeIndex]);
                return;
            }

            if (activeTab === "tools" && toolsView === "list") {
                setToolsView("duration");
                onActiveIndexChange(0);
                return;
            }

            if (activeTab === "tools" && toolsView === "duration") {
                const preset = FRAGMENT_DURATION_PRESET_OPTIONS[activeIndex];

                if (preset !== undefined) {
                    handleSelectDurationSeconds(preset);
                    return;
                }

                handleConfirmCustomDuration();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [
        activeIndex,
        activeTab,
        handleConfirmCustomDuration,
        handleSelectDurationSeconds,
        mentionItems,
        onActiveIndexChange,
        onSelect,
        open,
        toolsView,
    ]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;

            if (panelRef.current?.contains(target)) {
                return;
            }

            onClose();
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [onClose, open]);

    if (!open || !anchorRect) {
        return null;
    }

    // panelTop 弹窗顶部坐标（优先显示在光标下方）
    const panelTop = Math.min(anchorRect.bottom + 8, window.innerHeight - 420);
    // panelLeft 弹窗左侧坐标
    const panelLeft = Math.min(anchorRect.left, window.innerWidth - 520);

    const panel = (
        <div
            ref={panelRef}
            className="fixed z-80 flex items-start"
            style={{
                top: panelTop,
                left: panelLeft,
            }}
            onMouseDown={(event) => event.stopPropagation()}
        >
            <div
                className="flex w-[280px] shrink-0 flex-col rounded-2xl border border-black/5 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.14)]"
            >
                <div className="border-b border-black/5 px-3 py-2.5">
                    <div className="flex items-center gap-1 rounded-full bg-[#efeff4] p-1">
                        <button
                            type="button"
                            className={cn(
                                "inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition",
                                activeTab === "assets"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700",
                            )}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                setActiveTab("assets");
                                setToolsView("list");
                                onActiveIndexChange(0);
                            }}
                        >
                            <Briefcase className="size-3.5" strokeWidth={1.8} />
                            {scope === "series" ? "全剧资产" : "本集资产"}
                        </button>
                        <button
                            type="button"
                            className={cn(
                                "inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition",
                                activeTab === "tools"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700",
                            )}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                setActiveTab("tools");
                                setToolsView("list");
                                onActiveIndexChange(0);
                            }}
                        >
                            <LayoutGrid className="size-3.5" strokeWidth={1.8} />
                            小工具
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                    {activeTab === "assets" ? (
                        loading ? (
                            <p className="px-2 py-4 text-center text-xs text-slate-400">加载中...</p>
                        ) : mentionItems.length === 0 ? (
                            <p className="px-2 py-4 text-center text-xs text-slate-400">暂无匹配资产</p>
                        ) : (
                            <div className="space-y-3">
                                {groupedItems.map((group) => (
                                    <section key={group.label}>
                                        <p className="px-2 pb-1 text-xs text-slate-500">{group.label}</p>
                                        <div className="space-y-0.5">
                                            {group.items.map((item) => {
                                                const itemIndex = mentionItems.indexOf(item);

                                                return (
                                                    <EpisodeMentionListItem
                                                        key={item.asset.id}
                                                        item={item}
                                                        isActive={itemIndex === activeIndex}
                                                        onHover={() => onActiveIndexChange(itemIndex)}
                                                        onSelect={() => onSelect(item)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )
                    ) : toolsView === "list" ? (
                        <div className="space-y-0.5">
                            <button
                                type="button"
                                className={cn(
                                    "flex w-full cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-left transition",
                                    activeIndex === 0 ? "bg-[#efeff4]" : "hover:bg-[#f3f3f7]",
                                )}
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() => onActiveIndexChange(0)}
                                onClick={() => {
                                    setToolsView("duration");
                                    onActiveIndexChange(0);
                                }}
                            >
                                <Timer className="size-4 shrink-0 text-slate-500" strokeWidth={1.8} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-slate-800">添加时间</p>
                                    <p className="text-xs text-slate-500">插入片段时长标签</p>
                                </div>
                                <ChevronRight className="size-4 text-slate-400" strokeWidth={1.8} />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-1 px-1">
                            <p className="px-1 pb-1 text-xs text-slate-500">
                                已用 {contentDurationTotal}s / {FRAGMENT_CONTENT_DURATION_MAX}s
                            </p>
                            {FRAGMENT_DURATION_PRESET_OPTIONS.map((seconds, index) => {
                                const disabled = !canAddDuration(seconds);

                                return (
                                    <button
                                        key={seconds}
                                        type="button"
                                        disabled={disabled}
                                        className={cn(
                                            "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                                            activeIndex === index ? "bg-[#efeff4]" : "hover:bg-[#f3f3f7]",
                                            disabled && "cursor-not-allowed opacity-40",
                                        )}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onMouseEnter={() => onActiveIndexChange(index)}
                                        onClick={() => handleSelectDurationSeconds(seconds)}
                                    >
                                        <span className="size-1.5 rounded-full bg-slate-300" />
                                        <span>{seconds}s</span>
                                    </button>
                                );
                            })}
                            <div
                                className={cn(
                                    "flex items-center gap-2 rounded-xl px-3 py-2",
                                    activeIndex === FRAGMENT_DURATION_PRESET_OPTIONS.length
                                        ? "bg-[#efeff4]"
                                        : "",
                                )}
                                onMouseEnter={() =>
                                    onActiveIndexChange(FRAGMENT_DURATION_PRESET_OPTIONS.length)
                                }
                            >
                                <span className="size-1.5 rounded-full bg-slate-300" />
                                <input
                                    type="number"
                                    min={1}
                                    max={FRAGMENT_CONTENT_DURATION_MAX}
                                    placeholder={`Max ${FRAGMENT_CONTENT_DURATION_MAX}`}
                                    value={customDuration}
                                    onChange={(event) => setCustomDuration(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            handleConfirmCustomDuration();
                                        }
                                    }}
                                    className="h-8 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-400"
                                />
                                <span className="text-sm text-slate-500">s</span>
                                <button
                                    type="button"
                                    className="ml-auto cursor-pointer rounded-lg px-2 py-1 text-xs text-violet-600 hover:bg-violet-50"
                                    onClick={handleConfirmCustomDuration}
                                >
                                    确定
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {activeTab === "assets" ? (
                    <div className="space-y-0.5 border-t border-black/5 px-2 py-2">
                        <button
                            type="button"
                            className={cn(
                                "flex w-full cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-[#f3f3f7]",
                                scope === "series" && "bg-[#efeff4]",
                            )}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => onScopeChange("series")}
                        >
                            <Briefcase className="size-4 text-slate-500" strokeWidth={1.8} />
                            <span className="flex-1">全剧资产</span>
                            <ChevronRight className="size-4 text-slate-400" strokeWidth={1.8} />
                        </button>
                    </div>
                ) : toolsView === "duration" ? (
                    <div className="border-t border-black/5 px-3 py-2">
                        <button
                            type="button"
                            className="cursor-pointer text-xs text-slate-500 hover:text-slate-700"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                setToolsView("list");
                                onActiveIndexChange(0);
                            }}
                        >
                            返回小工具
                        </button>
                    </div>
                ) : null}
            </div>

            {activeTab === "assets" && previewItem?.previewUrl ? (
                <div className="ml-5 flex h-[300px] shrink-0 items-center">
                    <img
                        src={previewItem.previewUrl}
                        alt={previewItem.primaryLabel}
                        className="block h-[300px] w-auto max-w-none rounded-lg"
                    />
                </div>
            ) : null}
        </div>
    );

    return createPortal(panel, document.body);
}

export const EpisodeEditAssetMentionPopover = memo(EpisodeEditAssetMentionPopoverComponent);
