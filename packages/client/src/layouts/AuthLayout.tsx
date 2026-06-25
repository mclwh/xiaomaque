// 认证布局：无侧边栏的全屏页面壳，供登录等独立页面使用
import { Outlet } from "react-router-dom";

// 渲染认证相关页面的简洁布局
export function AuthLayout() {
    return (
        <div className="xyq-auth-layout min-h-svh bg-white">
            <Outlet />
        </div>
    );
}
