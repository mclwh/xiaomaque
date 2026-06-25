// 画布资产文件夹：毛玻璃弹层，按 Tab 浏览项目资产并定位节点
import { useMemo, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { useFocusCanvasAsset } from "@/hooks/useFocusCanvasAsset";
import { resolveCharacterGroupCardLabels } from "@/lib/assetDisplay";
import { ASSET_LIBRARY_TABS } from "@/lib/assetLibraryUi";
import {
    buildCanvasAssetFolderDisplayGroups,
    buildCanvasAssetFolderTabCounts,
} from "@/lib/canvasAssetFolder";
import {
    PROJECT_ASSET_GROUP_UNIT,
    resolveProjectAssetGroupName,
} from "@/lib/projectAssetGroups";
import type { ProjectAssetTabKey } from "@/lib/projectAssetTabs";
import { resolveStoragePreviewUrl } from "@/lib/storageUrl";
import { selectCanvasAssetsList } from "@/store/canvasSlice";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

type CanvasAssetFolderPanelProps = {
    open: boolean;
    onClose: () => void;
};

// 渲染画布资产文件夹毛玻璃面板
export function CanvasAssetFolderPanel({ open, onClose }: CanvasAssetFolderPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const { focusCanvasAssetById } = useFocusCanvasAsset();
    const assets = useAppSelector(selectCanvasAssetsList);
    // activeTab 当前资产分类 Tab
    const [activeTab, setActiveTab] = useState<ProjectAssetTabKey>("character");

    usePopoverDismiss(panelRef, open, onClose);

    const tabCounts = useMemo(() => buildCanvasAssetFolderTabCounts(assets), [assets]);
    const displayGroups = useMemo(
        () => buildCanvasAssetFolderDisplayGroups(assets, activeTab),
        [activeTab, assets],
    );
    const activeTabConfig =
        ASSET_LIBRARY_TABS.find((tab) => tab.id === activeTab) ?? ASSET_LIBRARY_TABS[0];

    // 点击资产卡片后定位到画布节点
    const handleLocateGroup = (assetId: number) => {
        focusCanvasAssetById(assetId);
        onClose();
    };

    if (!open) {
        return null;
    }

    return (
        <div
            ref={panelRef}
            className="pointer-events-auto absolute top-1/2 left-[calc(100%+12px)] z-40 w-[min(720px,calc(100vw-120px))] -translate-y-1/2"
        >
            <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                <div className="mb-4 flex items-end gap-6 border-b border-black/5">
                    {ASSET_LIBRARY_TABS.map((tab) => {
                        const selected = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                className={cn(
                                    "cursor-pointer border-b-2 pb-3 text-sm font-medium transition",
                                    selected
                                        ? "border-slate-900 text-slate-900"
                                        : "border-transparent text-slate-400 hover:text-slate-600",
                                )}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label} {tabCounts[tab.id]}
                            </button>
                        );
                    })}
                </div>

                <div className="nowheel max-h-[min(68vh,560px)] overflow-y-auto pr-1">
                    {displayGroups.length === 0 ? (
                        <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
                            暂无{activeTabConfig.label}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {displayGroups.map((group) => {
                                const asset = group.representativeAsset;
                                const coverUrl =
                                    activeTab === "material"
                                        ? null
                                        : resolveStoragePreviewUrl(asset.cover ?? asset.url);
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
                                const unit = PROJECT_ASSET_GROUP_UNIT[activeTab];
                                const countLabel = `共${group.totalCount}个${unit}`;

                                return (
                                    <button
                                        key={group.key}
                                        type="button"
                                        className="cursor-pointer overflow-hidden rounded-2xl bg-white/90 text-left shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition hover:bg-white hover:shadow-[0_8px_28px_rgba(15,23,42,0.1)]"
                                        onClick={() => handleLocateGroup(asset.id)}
                                    >
                                        <div className="aspect-[4/5] bg-[#efeff4]">
                                            {coverUrl ? (
                                                <img
                                                    src={coverUrl}
                                                    alt={groupName}
                                                    className="size-full object-cover"
                                                    draggable={false}
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center">
                                                    <ImageIcon
                                                        className="size-8 text-slate-300"
                                                        strokeWidth={1.4}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-0.5 px-3 py-2.5">
                                            <p className="truncate text-sm font-medium text-slate-900">
                                                {characterLabels?.characterName ?? groupName}
                                            </p>
                                            <p className="truncate text-xs text-slate-400">{countLabel}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
