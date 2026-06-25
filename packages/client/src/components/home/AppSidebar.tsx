// 应用壳左侧边栏：创作 / 短剧 Agent / 资产
import { NavLink } from "react-router-dom";
import { Bird, ChevronLeft, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_NAV_ITEMS } from "@/data/sidebarNav";

type AppSidebarProps = {
    collapsed: boolean;
    onToggleCollapsed: () => void;
};

// 侧边栏展开 / 收起过渡曲线
const SIDEBAR_EASE = "ease-[cubic-bezier(0.03,0.52,0.58,1)]";

// 渲染导航链接样式
function getNavLinkClass(isActive: boolean) {
    return cn(
        "inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl px-3.5 text-sm font-medium transition-colors",
        isActive
            ? "bg-black/[0.06] text-slate-900"
            : "text-slate-600 hover:bg-black/[0.04] hover:text-slate-900",
    );
}

// 渲染品牌图标与名称
function BrandContent() {
    return (
        <>
            <span className="inline-flex size-8 shrink-0 items-center justify-center text-slate-700">
                <Bird className="size-5" strokeWidth={2.2} />
            </span>
            <span className="truncate text-sm font-semibold text-slate-800">小麻雀</span>
        </>
    );
}

// 渲染固定位置的品牌区（展开 / 收起位置一致）
function SidebarBrand({
    collapsed,
    onExpand,
}: {
    collapsed: boolean;
    onExpand: () => void;
}) {
    if (collapsed) {
        return (
            <button
                type="button"
                aria-label="展开侧边栏"
                className="pointer-events-auto absolute top-1/2 left-3 flex w-[5.75rem] -translate-y-1/2 cursor-pointer items-center rounded-xl"
                onClick={onExpand}
            >
                <span className="group flex h-8 w-full items-center gap-2">
                    <span className="relative inline-flex size-8 shrink-0 items-center justify-center text-slate-700">
                        <Bird
                            className="size-5 transition-opacity duration-200 group-hover:opacity-0"
                            strokeWidth={2.2}
                        />
                        <span className="absolute inset-0 inline-flex items-center justify-center rounded-xl bg-white text-slate-700 opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
                            <PanelLeftOpen className="size-[18px]" strokeWidth={2} />
                        </span>
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-800 transition-opacity duration-200 group-hover:opacity-0">
                        小麻雀
                    </span>
                </span>
            </button>
        );
    }

    return (
        <div className="absolute top-1/2 left-3 flex w-[5.75rem] -translate-y-1/2 items-center">
            <span className="flex h-8 w-full items-center gap-2">
                <BrandContent />
            </span>
        </div>
    );
}

// 渲染应用壳侧边栏（含从左向右展开 / 收起过渡动画）
export function AppSidebar({ collapsed, onToggleCollapsed }: AppSidebarProps) {
    return (
        <aside
            className={cn(
                "fixed top-[10px] left-6 z-30 m-0 flex h-[calc(100vh-20px)] flex-col overflow-hidden origin-left",
                "transition-[width,background-color,border-color,border-radius,box-shadow,backdrop-filter] duration-[280ms]",
                SIDEBAR_EASE,
                collapsed
                    ? "pointer-events-none w-[calc(5.75rem+12px)] rounded-xl border border-transparent bg-transparent shadow-none backdrop-blur-none"
                    : "w-[260px] rounded-[20px] border border-white/65 bg-white/92 shadow-[0_18px_48px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-[56px] backdrop-saturate-[140%]",
            )}
        >
            <div className="relative h-[68px] shrink-0">
                <SidebarBrand collapsed={collapsed} onExpand={onToggleCollapsed} />

                <button
                    type="button"
                    aria-label="收起侧边栏"
                    aria-hidden={collapsed}
                    tabIndex={collapsed ? -1 : 0}
                    className={cn(
                        "absolute top-1/2 right-3 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5",
                        "transition-[opacity,transform,max-width,margin] duration-[280ms]",
                        SIDEBAR_EASE,
                        collapsed
                            ? "pointer-events-none scale-80 opacity-0"
                            : "scale-100 opacity-100 delay-[80ms]",
                    )}
                    onClick={onToggleCollapsed}
                >
                    <ChevronLeft className="size-4" />
                </button>
            </div>

            <nav
                aria-label="主导航"
                aria-hidden={collapsed}
                className={cn(
                    "flex flex-1 flex-col gap-1 overflow-hidden px-3 py-2",
                    "transition-[opacity,transform,max-width,margin] duration-[280ms]",
                    SIDEBAR_EASE,
                    collapsed
                        ? "pointer-events-none -translate-x-2 opacity-0"
                        : "translate-x-0 opacity-100 delay-100",
                )}
            >
                {SIDEBAR_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            end={item.path === "/"}
                            tabIndex={collapsed ? -1 : undefined}
                            className={({ isActive }) => getNavLinkClass(isActive)}
                        >
                            <Icon className="size-[18px] shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}
