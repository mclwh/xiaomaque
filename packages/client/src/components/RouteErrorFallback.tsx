// 路由级错误兜底页：模块加载失败时提供刷新恢复入口
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

// 从路由错误中提取可读文案
function resolveRouteErrorMessage(error: unknown) {
    if (isRouteErrorResponse(error)) {
        return error.statusText || (error.data as { message?: string })?.message || "页面加载失败";
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "页面加载失败";
}

// 渲染路由错误兜底 UI
export function RouteErrorFallback() {
    // error 当前路由捕获到的错误对象
    const error = useRouteError();
    // message 展示给用户的错误说明
    const message = resolveRouteErrorMessage(error);

    // 刷新当前页面以重新加载最新模块
    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
            <p className="text-lg font-medium text-slate-900">页面加载出错</p>
            <p className="max-w-md text-sm leading-6 text-slate-500">{message}</p>
            <button
                type="button"
                onClick={handleReload}
                className="inline-flex h-10 cursor-pointer items-center rounded-full bg-slate-900 px-5 text-sm text-white transition hover:bg-slate-800"
            >
                刷新页面
            </button>
        </div>
    );
}
