// 音频绑定角色树形多选：支持展开、单选、多选、全选
import { memo, useCallback, type MouseEvent } from "react";
import { Check, ChevronRight, Minus, UserRound } from "lucide-react";
import {
    formatProjectAssetGroupSummary,
    type ProjectAssetDisplayGroup,
} from "@/lib/projectAssetGroups";
import { resolveCharacterAppearanceLabel, resolveCharacterGroupCardLabels } from "@/lib/assetDisplay";
import {
    getAllCharacterAssetIds,
    getCheckboxState,
    getGroupCharacterAssetIds,
    toggleSelection,
    type CheckboxState,
} from "@/lib/audioCharacterBindingSelection";
import { resolveStoragePreviewUrl } from "@/lib/storageUrl";
import { cn } from "@/lib/utils";

type CanvasAudioBindCharacterTreeProps = {
    groups: ProjectAssetDisplayGroup[];
    selectedIds: Set<number>;
    expandedGroupKeys: Set<string>;
    disabled?: boolean;
    onSelectedIdsChange: (selectedIds: Set<number>) => void;
    onExpandedGroupKeysChange: (expandedGroupKeys: Set<string>) => void;
};

type BindCharacterCheckboxProps = {
    state: CheckboxState;
    disabled?: boolean;
    label: string;
    onToggle: () => void;
};

// 渲染树形勾选框
function BindCharacterCheckbox({ state, disabled, label, onToggle }: BindCharacterCheckboxProps) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={state === "indeterminate" ? "mixed" : state === "checked"}
            aria-label={label}
            disabled={disabled}
            onClick={onToggle}
            className={cn(
                "inline-flex size-4 shrink-0 items-center justify-center rounded border transition",
                state === "unchecked"
                    ? "border-slate-300 bg-white hover:border-violet-400"
                    : "border-violet-500 bg-violet-500 text-white",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
        >
            {state === "checked" ? <Check className="size-3" strokeWidth={3} /> : null}
            {state === "indeterminate" ? <Minus className="size-3" strokeWidth={3} /> : null}
        </button>
    );
}

type CharacterTreeAvatarProps = {
    coverUrl: string | null;
    alt: string;
};

// 渲染角色缩略图（统一 36px）
function CharacterTreeAvatar({ coverUrl, alt }: CharacterTreeAvatarProps) {
    if (coverUrl) {
        return (
            <img
                src={coverUrl}
                alt={alt}
                className="size-9 shrink-0 rounded-md object-cover"
            />
        );
    }

    return (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-400">
            <UserRound className="size-4" strokeWidth={1.8} />
        </div>
    );
}

// 渲染音频绑定角色树形多选
function CanvasAudioBindCharacterTreeComponent({
    groups,
    selectedIds,
    expandedGroupKeys,
    disabled = false,
    onSelectedIdsChange,
    onExpandedGroupKeysChange,
}: CanvasAudioBindCharacterTreeProps) {
    const allAssetIds = getAllCharacterAssetIds(groups);
    const allSelectedState = getCheckboxState(selectedIds, allAssetIds);

    // 阻止事件冒泡到 React Flow
    const stopFlowEvent = useCallback((event: MouseEvent) => {
        event.stopPropagation();
    }, []);

    // 切换全选
    const handleToggleSelectAll = useCallback(() => {
        onSelectedIdsChange(toggleSelection(selectedIds, allAssetIds));
    }, [allAssetIds, onSelectedIdsChange, selectedIds]);

    // 切换分组展开
    const handleToggleExpand = useCallback(
        (groupKey: string) => {
            const next = new Set(expandedGroupKeys);

            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }

            onExpandedGroupKeysChange(next);
        },
        [expandedGroupKeys, onExpandedGroupKeysChange],
    );

    // 切换分组勾选
    const handleToggleGroup = useCallback(
        (group: ProjectAssetDisplayGroup) => {
            onSelectedIdsChange(toggleSelection(selectedIds, getGroupCharacterAssetIds(group)));
        },
        [onSelectedIdsChange, selectedIds],
    );

    // 切换单个形象勾选
    const handleToggleAsset = useCallback(
        (assetId: number) => {
            onSelectedIdsChange(toggleSelection(selectedIds, [assetId]));
        },
        [onSelectedIdsChange, selectedIds],
    );

    if (groups.length === 0) {
        return (
            <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                暂无角色，请先在资产库创建角色
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-2" onMouseDown={stopFlowEvent} onPointerDown={stopFlowEvent}>
            <div className="flex items-center gap-2 rounded-lg px-1 py-1">
                <BindCharacterCheckbox
                    state={allSelectedState}
                    disabled={disabled}
                    label="全选角色"
                    onToggle={handleToggleSelectAll}
                />
                <span className="text-xs font-medium text-slate-700">全选</span>
                <span className="ml-auto text-xs text-slate-400">已选 {selectedIds.size} 个</span>
            </div>

            <div className="nowheel max-h-[280px] space-y-1 overflow-y-auto pr-0.5">
                {groups.map((group) => {
                    const groupKey = group.key;
                    const { characterName, appearanceName } = resolveCharacterGroupCardLabels(
                        group,
                        { characterFallback: "未命名角色" },
                    );
                    const summary = formatProjectAssetGroupSummary("character", group);
                    const groupAssetIds = getGroupCharacterAssetIds(group);
                    const groupState = getCheckboxState(selectedIds, groupAssetIds);
                    const isExpandable = group.totalCount > 1;
                    const isExpanded = expandedGroupKeys.has(groupKey);
                    const coverUrl = resolveStoragePreviewUrl(
                        group.representativeAsset.cover ?? group.representativeAsset.url,
                    );

                    return (
                        <div key={groupKey} className="rounded-xl border border-slate-100 bg-slate-50/60">
                            <div className="flex items-center gap-2 px-2 py-2">
                                {isExpandable ? (
                                    <button
                                        type="button"
                                        aria-expanded={isExpanded}
                                        aria-label={isExpanded ? "收起分组" : "展开分组"}
                                        disabled={disabled}
                                        onClick={() => handleToggleExpand(groupKey)}
                                        className={cn(
                                            "inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-slate-400 transition hover:bg-white hover:text-slate-600",
                                            disabled && "cursor-not-allowed opacity-50",
                                        )}
                                    >
                                        <ChevronRight
                                            className={cn(
                                                "size-3.5 transition-transform",
                                                isExpanded ? "rotate-90" : "",
                                            )}
                                            strokeWidth={2}
                                        />
                                    </button>
                                ) : (
                                    <span className="inline-block size-5 shrink-0" />
                                )}

                                <BindCharacterCheckbox
                                    state={groupState}
                                    disabled={disabled}
                                    label={`选择${characterName}`}
                                    onToggle={() => handleToggleGroup(group)}
                                />

                                <CharacterTreeAvatar coverUrl={coverUrl} alt={characterName} />

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-900">
                                        {characterName}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">{appearanceName}</p>
                                    <p className="truncate text-xs text-slate-400">{summary}</p>
                                </div>
                            </div>

                            {isExpandable && isExpanded ? (
                                <div className="space-y-0.5 border-t border-slate-100 px-2 py-1.5">
                                    {group.assets.map((asset, index) => {
                                        const assetName = resolveCharacterAppearanceLabel(
                                            asset,
                                            `形象 ${index + 1}`,
                                        );
                                        const assetCoverUrl = resolveStoragePreviewUrl(asset.cover ?? asset.url);
                                        const assetState = getCheckboxState(selectedIds, [asset.id]);

                                        return (
                                            <div
                                                key={asset.id}
                                                className="flex items-center gap-2 rounded-lg py-1.5 pl-7 pr-1 hover:bg-white/80"
                                            >
                                                <BindCharacterCheckbox
                                                    state={assetState}
                                                    disabled={disabled}
                                                    label={`选择${assetName}`}
                                                    onToggle={() => handleToggleAsset(asset.id)}
                                                />
                                                <CharacterTreeAvatar
                                                    coverUrl={assetCoverUrl}
                                                    alt={assetName}
                                                />
                                                <span className="min-w-0 flex-1 truncate text-xs text-slate-700">
                                                    {assetName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export const CanvasAudioBindCharacterTree = memo(CanvasAudioBindCharacterTreeComponent);
