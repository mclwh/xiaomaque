// 未登录顶栏操作区：帮助与登录入口
import { Link, useLocation } from "react-router-dom";
import { HelpCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

// 渲染未登录态顶栏右侧工具栏
export function TopTitlebarGuest() {
    const location = useLocation();
    // loginRedirect 登录成功后的回跳地址
    const loginRedirect = encodeURIComponent(`${location.pathname}${location.search}`);

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="rounded-full bg-white/70 text-slate-700 backdrop-blur hover:bg-white/90"
            >
                <HelpCircle className="size-4" />
                帮助
            </Button>
            <Button
                asChild
                size="sm"
                className="rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800"
            >
                <Link to={`/login?redirect_url=${loginRedirect}`}>
                    <LogIn className="size-4" />
                    登录
                </Link>
            </Button>
        </>
    );
}
