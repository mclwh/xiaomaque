// 路由配置：Hash 路由，嵌套路由在父级布局的 Outlet 中渲染
import { createHashRouter } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { RootLayout } from "@/layouts/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NovelPage } from "@/pages/NovelPage";
import { CanvasPage } from "@/pages/CanvasPage";
import { EpisodeEditPage } from "@/pages/EpisodeEditPage";
import { ProjectPage } from "@/pages/ProjectPage";
import { AssetPage } from "@/pages/AssetPage";
import { RouteErrorFallback } from "@/components/RouteErrorFallback";

export const router = createHashRouter([
    {
        path: "/login",
        element: <AuthLayout />,
        children: [
            {
                index: true,
                element: <LoginPage />,
            },
        ],
    },
    {
        path: "/novel/canvas/:projectId",
        element: <CanvasPage />,
        errorElement: <RouteErrorFallback />,
    },
    {
        path: "/novel/project/:projectId",
        element: <ProjectPage />,
    },
    {
        path: "/novel/project/:projectId/episode/:serieId/edit",
        element: <EpisodeEditPage />,
        errorElement: <RouteErrorFallback />,
    },
    {
        path: "/",
        element: <RootLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "novel",
                element: <NovelPage />,
            },
            {
                path: "asset",
                element: <AssetPage />,
            },
        ],
    },
]);
