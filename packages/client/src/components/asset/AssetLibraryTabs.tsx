// 资产库顶部 Tab 切换栏
import { ASSET_LIBRARY_TABS, type AssetLibraryTab } from "@/lib/assetLibraryUi";
import { cn } from "@/lib/utils";

type AssetLibraryTabsProps = {
    activeTab: AssetLibraryTab;
    onChange: (tab: AssetLibraryTab) => void;
};

// 渲染资产库角色 / 场景 / 道具 / 素材 Tab
export function AssetLibraryTabs({ activeTab, onChange }: AssetLibraryTabsProps) {
    return (
        <div className="xyq-asset-tab-bar inline-flex items-center gap-1 rounded-full bg-[#e8e8ec] p-1">
            {ASSET_LIBRARY_TABS.map((tab) => {
                const TabIcon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium transition",
                            activeTab === tab.id
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-600 hover:text-slate-800",
                        )}
                    >
                        <TabIcon className="size-4" strokeWidth={1.8} />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
