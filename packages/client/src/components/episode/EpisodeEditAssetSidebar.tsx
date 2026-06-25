// 分集编辑页：左侧素材选择栏
import {
    Building2,
    Image as ImageIcon,
    Plus,
    Shapes,
    Star,
    User,
    ZoomIn,
    type LucideIcon,
} from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProjectAsset } from "@/api/asset";
import {
    EpisodeEditAssetPreview,
    resolveEpisodeAssetPreviewUrl,
} from "@/components/episode/EpisodeEditAssetPreview";
import { useEpisodeEditAssets } from "@/hooks/useEpisodeEditAssets";
import { getCanvasPagePath } from "@/hooks/useEnterFreeCanvas";
import {
    resolveCharacterGroupCardLabels,
} from "@/lib/assetDisplay";
import {
    buildEpisodeAssetSidebarSections,
    EPISODE_ASSET_TAB_LABEL,
    type EpisodeAssetScope,
} from "@/lib/episodeAssetSidebar";
import {
    resolveProjectAssetGroupName,
    type ProjectAssetDisplayGroup,
} from "@/lib/projectAssetGroups";
import type { ProjectAssetTabKey } from "@/lib/projectAssetTabs";
import { resolveStoragePreviewUrl } from "@/lib/storageUrl";
import { cn } from "@/lib/utils";

type EpisodeEditAssetSidebarProps = {
    projectId: number;
    serieId: number;
};

type EpisodeAssetTabConfig = {
    key: ProjectAssetTabKey;
    icon: LucideIcon;
    unnamedLabel: string;
};

// EPISODE_ASSET_TAB_CONFIG 素材分类配置
const EPISODE_ASSET_TAB_CONFIG: EpisodeAssetTabConfig[] = [
    { key: "character", icon: User, unnamedLabel: "未命名角色" },
    { key: "scene", icon: Building2, unnamedLabel: "未命名场景" },
    { key: "material", icon: Shapes, unnamedLabel: "未命名素材" },
    { key: "prop", icon: Star, unnamedLabel: "未命名道具" },
];

type EpisodeEditAssetCardProps = {
    group: ProjectAssetDisplayGroup;
    tabKey: ProjectAssetTabKey;
    unnamedLabel: string;
    selectedAssetId: number | null;
    onSelect: (assetId: number) => void;
    onPreview: (asset: ProjectAsset, title: string) => void;
};

// 渲染素材卡片
const EpisodeEditAssetCard = memo(function EpisodeEditAssetCard({
    group,
    tabKey,
    unnamedLabel,
    selectedAssetId,
    onSelect,
    onPreview,
}: EpisodeEditAssetCardProps) {
    // asset 代表资产
    const asset = group.representativeAsset;
    // coverUrl 封面地址
    const coverUrl =
        tabKey === "material" ? null : resolveStoragePreviewUrl(asset.cover ?? asset.url);
    // isCharacter 是否为角色卡片
    const isCharacter = tabKey === "character";
    // characterLabels 角色名与形象名
    const characterLabels = isCharacter
        ? resolveCharacterGroupCardLabels(group, { characterFallback: unnamedLabel })
        : null;
    // groupName 展示名称
    const groupName = isCharacter
        ? null
        : resolveProjectAssetGroupName(group, unnamedLabel);
    // isSelected 是否选中
    const isSelected = selectedAssetId === asset.id;
    // isScene 是否为场景（横图单列）
    const isScene = tabKey === "scene";
    // previewUrl 可预览媒体地址
    const previewUrl = resolveEpisodeAssetPreviewUrl(asset);
    // previewTitle 预览弹层标题
    const previewTitle = characterLabels?.characterName ?? groupName ?? unnamedLabel;

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl bg-white text-left transition hover:shadow-sm",
                isSelected ? "ring-2 ring-black ring-offset-2 ring-offset-[#f7f7f8]" : "",
            )}
        >
            {previewUrl ? (
                <button
                    type="button"
                    aria-label={`预览${previewTitle}`}
                    className="absolute top-1.5 right-1.5 z-10 inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
                    onClick={(event) => {
                        event.stopPropagation();
                        onPreview(asset, previewTitle);
                    }}
                >
                    <ZoomIn className="size-3.5" strokeWidth={2} />
                </button>
            ) : null}

            <button
                type="button"
                className="w-full cursor-pointer text-left"
                onClick={() => onSelect(asset.id)}
            >
            <div
                className={cn(
                    "flex w-full items-center justify-center overflow-hidden bg-[#efeff4]",
                    isScene ? "aspect-4/3" : "aspect-3/4",
                )}
            >
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={characterLabels?.characterName ?? groupName ?? ""}
                        className="size-full object-cover"
                    />
                ) : (
                    <ImageIcon className="size-7 text-slate-300" strokeWidth={1.4} />
                )}
            </div>
            {isCharacter && characterLabels ? (
                <div className="space-y-0.5 px-1.5 py-2">
                    <p className="truncate text-xs font-medium text-slate-800">
                        {characterLabels.characterName}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                        {characterLabels.appearanceName}
                    </p>
                </div>
            ) : (
                <p className="truncate px-1.5 py-2 text-xs text-slate-600">{groupName}</p>
            )}
            </button>
        </div>
    );
});

type EpisodeEditAssetSectionProps = {
    tabKey: ProjectAssetTabKey;
    label: string;
    groups: ProjectAssetDisplayGroup[];
    selectedAssetId: number | null;
    onSelect: (assetId: number) => void;
    onPreview: (asset: ProjectAsset, title: string) => void;
};

// 渲染单个分类区块
function EpisodeEditAssetSection({
    tabKey,
    label,
    groups,
    selectedAssetId,
    onSelect,
    onPreview,
}: EpisodeEditAssetSectionProps) {
    const tabConfig =
        EPISODE_ASSET_TAB_CONFIG.find((item) => item.key === tabKey) ?? EPISODE_ASSET_TAB_CONFIG[0];
    const SectionIcon = tabConfig.icon;
    // isScene 场景使用单列布局
    const isScene = tabKey === "scene";

    return (
        <section className="space-y-2">
            <div className="flex items-center gap-1.5 px-1 text-sm font-medium text-slate-800">
                <SectionIcon className="size-4 text-slate-500" strokeWidth={1.8} />
                {label}
            </div>

            <div
                className={cn(
                    "gap-2",
                    isScene ? "flex flex-col" : "grid grid-cols-2",
                )}
            >
                {groups.map((group) => (
                    <EpisodeEditAssetCard
                        key={group.key}
                        group={group}
                        tabKey={tabKey}
                        unnamedLabel={tabConfig.unnamedLabel}
                        selectedAssetId={selectedAssetId}
                        onSelect={onSelect}
                        onPreview={onPreview}
                    />
                ))}
            </div>
        </section>
    );
}

// 渲染左侧素材栏
export function EpisodeEditAssetSidebar({ projectId, serieId }: EpisodeEditAssetSidebarProps) {
    const navigate = useNavigate();
    const { assets, loading, errorMessage } = useEpisodeEditAssets(projectId);
    // scope 本集 / 全集
    const [scope, setScope] = useState<EpisodeAssetScope>("episode");
    // activeFilter 当前筛选分类（默认选中角色）
    const [activeFilter, setActiveFilter] = useState<ProjectAssetTabKey | null>("character");
    // selectedAssetId 当前选中资产
    const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
    // previewAsset 当前预览资产
    const [previewAsset, setPreviewAsset] = useState<ProjectAsset | null>(null);
    // previewTitle 当前预览标题
    const [previewTitle, setPreviewTitle] = useState("");

    // 打开资产预览
    const handlePreviewAsset = (asset: ProjectAsset, title: string) => {
        setPreviewAsset(asset);
        setPreviewTitle(title);
    };

    // 关闭资产预览
    const handleClosePreview = () => {
        setPreviewAsset(null);
        setPreviewTitle("");
    };

    // sections 素材栏分组
    const sections = useMemo(
        () => buildEpisodeAssetSidebarSections(assets, serieId, scope, activeFilter),
        [activeFilter, assets, scope, serieId],
    );

    // 切换分类筛选
    const handleFilterClick = (tabKey: ProjectAssetTabKey) => {
        setActiveFilter((current) => (current === tabKey ? null : tabKey));
    };

    // 跳转画布新增素材
    const handleOpenCanvas = () => {
        navigate(getCanvasPagePath(projectId));
    };

    return (
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-black/5 bg-[#f7f7f8]">
            <div className="flex items-center justify-between gap-2 border-b border-black/5 px-3 py-3">
                <div className="inline-flex rounded-full bg-white p-0.5 text-xs">
                    <button
                        type="button"
                        className={cn(
                            "cursor-pointer rounded-full px-3 py-1 transition",
                            scope === "episode"
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:text-slate-700",
                        )}
                        onClick={() => setScope("episode")}
                    >
                        本集
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "cursor-pointer rounded-full px-3 py-1 transition",
                            scope === "series"
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:text-slate-700",
                        )}
                        onClick={() => setScope("series")}
                    >
                        全集
                    </button>
                </div>

                <button
                    type="button"
                    aria-label="去画布添加素材"
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-white text-slate-600 transition hover:bg-slate-100"
                    onClick={handleOpenCanvas}
                >
                    <Plus className="size-4" strokeWidth={1.8} />
                </button>
            </div>

            <div className="flex flex-wrap gap-1.5 px-3 py-2">
                {EPISODE_ASSET_TAB_CONFIG.map((tab) => {
                    const isActive = activeFilter === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            className={cn(
                                "cursor-pointer rounded-full px-2.5 py-1 text-xs transition",
                                isActive
                                    ? "bg-slate-900 text-white"
                                    : "bg-white text-slate-600 hover:bg-slate-100",
                            )}
                            onClick={() => handleFilterClick(tab.key)}
                        >
                            {EPISODE_ASSET_TAB_LABEL[tab.key]}
                        </button>
                    );
                })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                {loading ? (
                    <div className="flex min-h-[160px] items-center justify-center text-xs text-slate-400">
                        加载中...
                    </div>
                ) : errorMessage ? (
                    <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-500">
                        {errorMessage}
                    </div>
                ) : sections.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-400">
                        暂无素材，点击右上角前往画布添加
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sections.map((section) => (
                            <EpisodeEditAssetSection
                                key={section.tabKey}
                                tabKey={section.tabKey}
                                label={section.label}
                                groups={section.groups}
                                selectedAssetId={selectedAssetId}
                                onSelect={setSelectedAssetId}
                                onPreview={handlePreviewAsset}
                            />
                        ))}
                    </div>
                )}
            </div>

            <EpisodeEditAssetPreview
                asset={previewAsset}
                title={previewTitle}
                onClose={handleClosePreview}
            />
        </aside>
    );
}
