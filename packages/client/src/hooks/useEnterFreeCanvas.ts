// 进入自由画布：静默创建默认项目后跳转画布页
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createProject, type Project } from "@/api/project";
import { useAsyncRequest } from "@/hooks/useAsyncRequest";
import { useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated } from "@/store/authSlice";

// 根据项目 ID 生成画布页路径，可选定位到指定资产节点
export function getCanvasPagePath(projectId: number, assetId?: number) {
    const basePath = `/novel/canvas/${projectId}`;

    if (!assetId) {
        return basePath;
    }

    return `${basePath}?asset_id=${assetId}`;
}

// 封装创建项目并进入自由画布的流程
export function useEnterFreeCanvas() {
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const {
        loading,
        errorMessage,
        run: runCreateProject,
    } = useAsyncRequest<Project, undefined>(async () => createProject(), {
        defaultErrorMessage: "创建项目失败，请稍后重试",
    });

    // 创建项目后跳转到对应画布页
    const enterFreeCanvas = useCallback(async () => {
        if (loading) {
            return;
        }

        if (!isAuthenticated) {
            const redirectUrl = encodeURIComponent(`${location.pathname}${location.search}`);
            navigate(`/login?redirect_url=${redirectUrl}`);
            return;
        }

        const project = await runCreateProject(undefined);
        if (project) {
            navigate(getCanvasPagePath(project.id));
        }
    }, [isAuthenticated, loading, location.pathname, location.search, navigate, runCreateProject]);

    return {
        enterFreeCanvas,
        loading,
        errorMessage,
    };
}
