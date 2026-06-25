// 根布局：应用壳 + 首页背景层 + 侧边栏
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/home/AppSidebar";
import { TopTitlebar } from "@/components/home/TopTitlebar";
import { HOME_BG_IMAGE } from "@/constants/homeAssets";
import { cn } from "@/lib/utils";

// 渲染全局应用壳布局
export function RootLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();
    // showHomeBackground 仅首页展示顶部背景图
    const showHomeBackground = location.pathname === "/";

    return (
        <div className="relative min-h-svh overflow-x-hidden bg-[#f3f3f3]">
            {showHomeBackground ? (
                <>
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-cover bg-top bg-no-repeat"
                        style={{ backgroundImage: `url(${HOME_BG_IMAGE})` }}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-gradient-to-b from-black/10 via-transparent to-[#f3f3f3]"
                    />
                </>
            ) : null}

            <div className="relative z-[1] flex min-h-svh">
                <div
                    className={cn(
                        "shrink-0 transition-[width] duration-[280ms] ease-[cubic-bezier(0.03,0.52,0.58,1)]",
                        sidebarCollapsed ? "w-0" : "w-[284px]",
                    )}
                    aria-hidden
                />

                <AppSidebar
                    collapsed={sidebarCollapsed}
                    onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
                />

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopTitlebar />
                    <main className="flex min-h-0 flex-1 flex-col">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
