// 项目工作流：资产库步骤（角色 / 场景 / 道具 / 素材）
import {
    AudioLines,
    Building2,
    ChevronRight,
    Image as ImageIcon,
    Plus,
    Shapes,
    Star,
    Type,
    User,
    Play,
    type LucideIcon,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectAssetTabs } from "@/hooks/useProjectAssetTabs";
import { getCanvasPagePath } from "@/hooks/useEnterFreeCanvas";
import type { ProjectAssetTabCounts, ProjectAssetTabKey } from "@/lib/projectAssetTabs";
import {
    resolveCharacterGroupCardLabels,
} from "@/lib/assetDisplay";
import {
    formatProjectAssetGroupSummary,
    resolveProjectAssetGroupName,
} from "@/lib/projectAssetGroups";
import { resolveStoragePreviewUrl } from "@/lib/storageUrl";
import { cn } from "@/lib/utils";

// ProjectAssetTabConfig 资产库 Tab 配置
type ProjectAssetTabConfig = {
    key: ProjectAssetTabKey;
    label: string;
    icon: LucideIcon;
    unnamedLabel: string;
    createLabel: string;
};

// PROJECT_ASSET_TABS 资产库 Tab 配置
const PROJECT_ASSET_TABS: ProjectAssetTabConfig[] = [
    {
        key: "character",
        label: "角色",
        icon: User,
        unnamedLabel: "未命名角色",
        createLabel: "新创建角色",
    },
    {
        key: "scene",
        label: "场景",
        icon: Building2,
        unnamedLabel: "未命名场景",
        createLabel: "新创建场景",
    },
    {
        key: "prop",
        label: "道具",
        icon: Star,
        unnamedLabel: "未命名道具",
        createLabel: "新创建道具",
    },
    {
        key: "material",
        label: "素材",
        icon: Shapes,
        unnamedLabel: "未命名素材",
        createLabel: "新创建素材",
    },
];

// ProjectAssetCardSize 资产卡片默认尺寸（宽 × 高，单位 px）
type ProjectAssetCardSize = {
    width: number;
    height: number;
};

// PROJECT_ASSET_CARD_SIZES 各 Tab 资产卡片默认尺寸
const PROJECT_ASSET_CARD_SIZES: Record<ProjectAssetTabKey, ProjectAssetCardSize> = {
    character: { width: 195, height: 292 },
    scene: { width: 333, height: 248 },
    prop: { width: 142, height: 142 },
    material: { width: 142, height: 142 },
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

// 获取资产列表网格布局样式（按默认宽度自适应列数）
function getAssetGridStyle(tab: ProjectAssetTabKey): CSSProperties {
    const { width } = PROJECT_ASSET_CARD_SIZES[tab];

    return {
        gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${width}px), ${width}px))`,
    };
}

// 获取当前 Tab 的资产卡片自适应尺寸样式
function getAssetCardStyle(tab: ProjectAssetTabKey): CSSProperties {
    const size = PROJECT_ASSET_CARD_SIZES[tab];

    return {
        width: "100%",
        maxWidth: size.width,
        aspectRatio: `${size.width} / ${size.height}`,
    };
}

// 获取当前 Tab 的资产预览区尺寸样式
function getAssetPreviewStyle(tab: ProjectAssetTabKey): CSSProperties {
    const isCompactCard = tab === "prop" || tab === "material";

    if (isCompactCard) {
        return {
            width: "100%",
            height: "100%",
        };
    }

    return {
        width: "100%",
        flex: 1,
        minHeight: 0,
    };
}

type ProjectAssetStepProps = {
    projectId: number;
    initialTabCounts?: ProjectAssetTabCounts;
};

// 渲染资产库步骤内容
export function ProjectAssetStep({ projectId, initialTabCounts }: ProjectAssetStepProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<ProjectAssetTabKey>("character");
    const { displayGroups, loading, tabCounts } = useProjectAssetTabs(
        projectId,
        activeTab,
        initialTabCounts,
    );

    const activeTabConfig =
        PROJECT_ASSET_TABS.find((tab) => tab.key === activeTab) ?? PROJECT_ASSET_TABS[0];

    // 点击资产卡片进入画布并定位到对应节点
    const handleAssetClick = (assetId: number) => {
        navigate(getCanvasPagePath(projectId, assetId));
    };

    // 进入画布编辑页
    const handleOpenCanvas = () => {
        navigate(getCanvasPagePath(projectId));
    };

    const cardStyle = getAssetCardStyle(activeTab);
    const gridStyle = getAssetGridStyle(activeTab);
    const previewStyle = getAssetPreviewStyle(activeTab);
    const isCompactCard = activeTab === "prop" || activeTab === "material";

    return (
        <div className="mx-auto w-full max-w-[1120px] px-6 pb-28 pt-2">
            <div className="mb-4 mt-12 flex items-center justify-between gap-4">
                <div className="flex items-center gap-8 overflow-x-auto">
                    {PROJECT_ASSET_TABS.map((tab) => {
                        const TabIcon = tab.icon;
                        const isActive = activeTab === tab.key;

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                className={cn(
                                    "inline-flex shrink-0 cursor-pointer items-center gap-2 border-b-2 pb-3 pt-1 text-[15px] font-medium transition",
                                    isActive
                                        ? "border-slate-900 text-slate-900"
                                        : "border-transparent text-slate-400 hover:text-slate-600",
                                )}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <TabIcon className="size-[18px]" strokeWidth={1.8} />
                                {tab.label}
                                <span
                                    className={cn(
                                        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-normal",
                                        isActive
                                            ? "bg-slate-100 text-slate-500"
                                            : "bg-slate-100 text-slate-400",
                                    )}
                                >
                                    {tabCounts[tab.key]}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/85"
                    onClick={handleOpenCanvas}
                >
                    去画布编辑
                    <ChevronRight className="size-4" strokeWidth={2} />
                </button>
            </div>

            {loading ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-[20px] bg-white text-sm text-slate-400">
                    加载中...
                </div>
            ) : (
                <div className="grid gap-4" style={gridStyle}>
                    {displayGroups.map((group) => {
                        const asset = group.representativeAsset;
                        const TabIcon = activeTabConfig.icon;
                        const coverUrl =
                            activeTab === "material"
                                ? null
                                : resolveStoragePreviewUrl(asset.cover ?? asset.url);
                        const MaterialIcon =
                            activeTab === "material"
                                ? resolveMaterialAssetIcon(asset.assetType)
                                : TabIcon;
                        const groupName = resolveProjectAssetGroupName(
                            group,
                            activeTabConfig.unnamedLabel,
                        );
                        const characterLabels =
                            activeTab === "character"
                                ? resolveCharacterGroupCardLabels(group, {
                                      characterFallback: activeTabConfig.unnamedLabel,
                                  })
                                : null;

                        return (
                            <button
                                key={group.key}
                                type="button"
                                className={cn(
                                    "cursor-pointer overflow-hidden rounded-[20px] bg-white text-left transition hover:shadow-sm",
                                    isCompactCard ? "p-0" : "flex flex-col p-3",
                                )}
                                style={cardStyle}
                                onClick={() => handleAssetClick(asset.id)}
                            >
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
                                            className={cn(
                                                "text-slate-900",
                                                isCompactCard ? "size-8" : "size-10",
                                            )}
                                            strokeWidth={1.4}
                                        />
                                    )}
                                    {isCompactCard ? (
                                        <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
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
                                            <p className="truncate text-sm font-medium text-slate-900">
                                                {groupName}
                                            </p>
                                        )}
                                        <span className="inline-flex rounded-md border border-[#f0c9bc] bg-[#fff5f1] px-2 py-0.5 text-xs text-[#d97757]">
                                            {formatProjectAssetGroupSummary(activeTab, group)}
                                        </span>
                                    </div>
                                ) : null}
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        className={cn(
                            "cursor-pointer overflow-hidden rounded-[20px] bg-white text-left transition hover:shadow-sm",
                            isCompactCard ? "p-0" : "flex flex-col p-3",
                        )}
                        style={cardStyle}
                        onClick={handleOpenCanvas}
                    >
                        <div
                            className={cn(
                                "flex items-center justify-center bg-[#efeff4]",
                                isCompactCard ? "h-full rounded-[20px]" : "mb-3 rounded-2xl",
                            )}
                            style={previewStyle}
                        >
                            <span
                                className={cn(
                                    "inline-flex items-center justify-center rounded-full border border-dashed border-slate-300 bg-white/70",
                                    isCompactCard ? "size-10" : "size-12",
                                )}
                            >
                                <Plus className="size-5 text-slate-400" strokeWidth={1.8} />
                            </span>
                        </div>

                        {!isCompactCard ? (
                            <div className="space-y-1 px-1">
                                <p className="text-sm font-medium text-slate-900">
                                    {activeTabConfig.createLabel}
                                </p>
                                <p className="text-xs text-slate-400">去画布创建</p>
                            </div>
                        ) : null}
                    </button>
                </div>
            )}
        </div>
    );
}
