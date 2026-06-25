// 应用壳顶栏：根据登录态切换未登录 / 已登录操作区
import { TopTitlebarGuest } from "@/components/home/TopTitlebarGuest";
import { TopTitlebarLoggedIn } from "@/components/home/TopTitlebarLoggedIn";
import { selectIsAuthenticated } from "@/store/authSlice";
import { useAppSelector } from "@/store/hooks";

// 渲染首页透明顶栏
export function TopTitlebar() {
    // isAuthenticated 当前是否已登录
    const isAuthenticated = useAppSelector(selectIsAuthenticated);

    return (
        <header className="flex h-[68px] shrink-0 items-center justify-end gap-2 px-6">
            <div className="flex items-center gap-2">
                {isAuthenticated ? <TopTitlebarLoggedIn /> : <TopTitlebarGuest />}
            </div>
        </header>
    );
}
