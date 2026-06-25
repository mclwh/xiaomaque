// 登录后顶栏操作区：设置、用户菜单（悬浮展开，含退出登录）
import { Bird, LogOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArkApiKeySettingsButton } from "@/components/home/ArkApiKeySettingsButton";
import { usePopoverDismiss } from "@/hooks/usePopoverDismiss";
import { cn } from "@/lib/utils";
import { logout } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// MENU_CLOSE_DELAY_MS 鼠标离开菜单区域后延迟关闭（便于移入下拉层）
const MENU_CLOSE_DELAY_MS = 120;

// 渲染登录态顶栏右侧设置与用户菜单
export function TopTitlebarLoggedIn() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    // open 用户菜单是否展开
    const [open, setOpen] = useState(false);
    // rootRef 菜单根节点
    const rootRef = useRef<HTMLDivElement>(null);
    // closeTimerRef 延迟关闭定时器
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    usePopoverDismiss(rootRef, open, () => setOpen(false));

    // 清除延迟关闭定时器
    const clearCloseTimer = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    useEffect(() => clearCloseTimer, [clearCloseTimer]);

    // 鼠标移入时展开菜单
    const handleMouseEnter = useCallback(() => {
        clearCloseTimer();
        setOpen(true);
    }, [clearCloseTimer]);

    // 鼠标移出时延迟收起菜单
    const handleMouseLeave = useCallback(() => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => setOpen(false), MENU_CLOSE_DELAY_MS);
    }, [clearCloseTimer]);

    // 退出登录并跳转登录页
    const handleLogout = useCallback(() => {
        setOpen(false);
        dispatch(logout());
        navigate("/login");
    }, [dispatch, navigate]);

    // displayName 菜单顶部展示名称
    const nickname = user?.nickname?.trim();
    const phone = user?.phone?.trim();
    const displayName = nickname || phone || "用户";
    // showPhone 是否在昵称下方展示手机号
    const showPhone = Boolean(phone && phone !== displayName);

    return (
        <>
            <div className="flex items-center gap-2">
                <ArkApiKeySettingsButton variant="titlebar" />

                <div
                    ref={rootRef}
                    className="relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <button
                        type="button"
                        aria-label="用户菜单"
                        aria-expanded={open}
                        aria-haspopup="menu"
                        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-slate-50"
                    >
                        <Bird className="size-4 text-slate-900" strokeWidth={2.2} />
                    </button>

                    {open ? (
                        <div
                            role="menu"
                            className="absolute right-0 top-full z-50 mt-2 min-w-[168px] rounded-xl border border-black/5 bg-white p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
                        >
                            <div className="px-3 py-2">
                                <div className="text-sm font-medium text-slate-900">{displayName}</div>
                                {showPhone ? (
                                    <div className="mt-0.5 text-xs text-slate-400">{phone}</div>
                                ) : null}
                            </div>
                            <div className="my-1 h-px bg-slate-100" />
                            <button
                                type="button"
                                role="menuitem"
                                className={cn(
                                    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50",
                                )}
                                onClick={handleLogout}
                            >
                                <LogOut className="size-4" strokeWidth={1.8} />
                                退出登录
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}
