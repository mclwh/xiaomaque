// 资产库单张资产卡片
import {
    AudioLines,
    Check,
    Image as ImageIcon,
    Play,
    Shapes,
    Type,
    type LucideIcon,
} from "lucide-react";
import type { ProjectAsset } from "@/api/asset";
import { resolveCharacterGroupCardLabels } from "@/lib/assetDisplay";
import {
    ASSET_LIBRARY_TABS,
    getAssetLibraryCardStyle,
    getAssetLibraryPreviewStyle,
    isCompactAssetLibraryTab,
    type AssetLibraryTab,
    type AssetLibraryViewMode,
} from "@/lib/assetLibraryUi";
import {
    formatProjectAssetGroupSummary,
    resolveProjectAssetGroupName,
    type ProjectAssetDisplayGroup,
} from "@/lib/projectAssetGroups";
import { resolveStoragePreviewUrl } from "@/lib/storageUrl";
import { cn } from "@/lib/utils";

type AssetLibraryCardProps = {
    activeTab: AssetLibraryTab;
    group: ProjectAssetDisplayGroup;
    viewMode?: AssetLibraryViewMode;
    fluid?: boolean;
    selectionMode?: boolean;
    selected?: boolean;
    onClick: (asset: ProjectAsset) => void;
    onToggleSelect?: (groupKey: string) => void;
};

// 根据素材媒体类型返回预览图标
function resolveMaterialAssetIcon(assetType: string): LucideIcon {
    if (assetType === "audio") {
        return AudioLines;
    }

    if (assetType === "video") {
        return Play;
    }

    if (assetType === "text") {
        return Type;
    }

    if (assetType === "image") {
        return ImageIcon;
    }

    return Shapes;
}

// 渲染资产库单张资产卡片
export function AssetLibraryCard({
    activeTab,
    group,
    viewMode = "grid",
    fluid = false,
    selectionMode = false,
    selected = false,
    onClick,
    onToggleSelect,
}: AssetLibraryCardProps) {
    const asset = group.representativeAsset;
    const activeTabConfig =
        ASSET_LIBRARY_TABS.find((tab) => tab.id === activeTab) ?? ASSET_LIBRARY_TABS[0];
    const cardStyle = getAssetLibraryCardStyle(activeTab, fluid);
    const previewStyle = getAssetLibraryPreviewStyle(activeTab);
    const isCompactCard = isCompactAssetLibraryTab(activeTab);
    const TabIcon = activeTabConfig.icon;
    const coverUrl =
        activeTab === "material" ? null : resolveStoragePreviewUrl(asset.cover ?? asset.url);
    const MaterialIcon =
        activeTab === "material" ? resolveMaterialAssetIcon(asset.assetType) : TabIcon;
    const groupName = resolveProjectAssetGroupName(group, activeTabConfig.unnamedLabel);
    const characterLabels =
        activeTab === "character"
            ? resolveCharacterGroupCardLabels(group, {
                  characterFallback: activeTabConfig.unnamedLabel,
              })
            : null;

    // 点击卡片：选择模式下切换选中，否则进入画布
    const handleClick = () => {
        if (selectionMode) {
            onToggleSelect?.(group.key);
            return;
        }

        onClick(asset);
    };

    if (viewMode === "list") {
        return (
            <button
                type="button"
                className={cn(
                    "flex h-[76px] w-full shrink-0 cursor-pointer items-center gap-3 rounded-2xl bg-white px-3 py-2 text-left transition hover:shadow-sm",
                    selected && "ring-2 ring-slate-900",
                )}
                onClick={handleClick}
            >
                {selectionMode ? (
                    <span
                        className={cn(
                            "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                            selected
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white",
                        )}
                    >
                        {selected ? <Check className="size-3" strokeWidth={2.5} /> : null}
                    </span>
                ) : null}
                <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#efeff4]">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={asset.name ?? "资产封面"}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <MaterialIcon className="size-5 text-slate-900" strokeWidth={1.4} />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    {characterLabels ? (
                        <>
                            <p className="truncate text-sm font-medium text-slate-900">
                                {characterLabels.characterName}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {characterLabels.appearanceName}
                            </p>
                        </>
                    ) : (
                        <p className="truncate text-sm font-medium text-slate-900">{groupName}</p>
                    )}
                    <span className="mt-1 inline-flex rounded-md border border-[#f0c9bc] bg-[#fff5f1] px-2 py-0.5 text-xs text-[#d97757]">
                        {formatProjectAssetGroupSummary(activeTab, group)}
                    </span>
                </div>
            </button>
        );
    }

    return (
        <button
            type="button"
            className={cn(
                "relative cursor-pointer overflow-hidden rounded-[20px] bg-white text-left transition hover:shadow-sm",
                isCompactCard ? "p-0" : "flex flex-col p-3",
                selected && "ring-2 ring-slate-900",
            )}
            style={cardStyle}
            onClick={handleClick}
        >
            {selectionMode ? (
                <span
                    className={cn(
                        "absolute top-2 left-2 z-10 inline-flex size-5 items-center justify-center rounded-full border",
                        selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-white/80 bg-black/30 text-transparent",
                    )}
                >
                    <Check className="size-3" strokeWidth={2.5} />
                </span>
            ) : null}
            <div
                className={cn(
                    "relative flex items-center justify-center overflow-hidden bg-[#efeff4]",
                    isCompactCard ? "rounded-[20px]" : "mb-3 rounded-2xl",
                )}
                style={previewStyle}
            >
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={asset.name ?? "资产封面"}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <MaterialIcon
                        className={cn("text-slate-900", isCompactCard ? "size-8" : "size-10")}
                        strokeWidth={1.4}
                    />
                )}
                {isCompactCard ? (
                    <span className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
                        {group.totalCount}
                    </span>
                ) : null}
            </div>

            {!isCompactCard ? (
                <div className="space-y-1 px-1">
                    {characterLabels ? (
                        <>
                            <p className="truncate text-sm font-medium text-slate-900">
                                {characterLabels.characterName}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {characterLabels.appearanceName}
                            </p>
                        </>
                    ) : (
                        <p className="truncate text-sm font-medium text-slate-900">{groupName}</p>
                    )}
                    <span className="inline-flex rounded-md border border-[#f0c9bc] bg-[#fff5f1] px-2 py-0.5 text-xs text-[#d97757]">
                        {formatProjectAssetGroupSummary(activeTab, group)}
                    </span>
                </div>
            ) : null}
        </button>
    );
}
