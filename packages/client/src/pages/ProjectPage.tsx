// 短剧项目工作流页：剧情大纲 / 资产库 / 分集视频
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ProjectAssetStep } from "@/components/project/ProjectAssetStep";
import { ProjectOutlineStep } from "@/components/project/ProjectOutlineStep";
import { ProjectEditableTitle } from "@/components/project/ProjectEditableTitle";
import { ProjectEpisodeStep } from "@/components/project/ProjectEpisodeStep";
import { ProjectStepBar } from "@/components/project/ProjectStepBar";
import { TopCenterToast } from "@/components/ui/top-center-toast";
import { useProjectDetail } from "@/hooks/useProjectDetail";
import { getNovelPagePath } from "@/lib/projectPaths";
import type { ProjectStepKey } from "@/lib/projectSteps";

// 渲染项目工作流页
export function ProjectPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { projectId } = useParams<{ projectId: string }>();
    const numericProjectId = Number(projectId);
    const { project, steps, activeStep, setActiveStep, loading, errorMessage, updateProjectTitle } =
        useProjectDetail(numericProjectId);
    // toastMessage 顶部提示文案
    const [toastMessage, setToastMessage] = useState("");

    useEffect(() => {
        // locationState 路由 state：支持从 AI 面板跳转或编辑页返回
        const locationState = location.state as
            | { activeStep?: ProjectStepKey; returnStep?: ProjectStepKey }
            | null;

        if (locationState?.activeStep) {
            setActiveStep(locationState.activeStep);
            return;
        }

        if (locationState?.returnStep) {
            setActiveStep(locationState.returnStep);
        }
    }, [location.state, setActiveStep]);

    if (!Number.isFinite(numericProjectId) || numericProjectId <= 0) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-[#f5f5f5] text-sm text-slate-500">
                项目 ID 无效
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-[#f5f5f5] text-sm text-slate-500">
                加载中...
            </div>
        );
    }

    if (errorMessage || !project) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-[#f5f5f5] text-sm text-red-500">
                {errorMessage || "项目不存在"}
            </div>
        );
    }

    return (
        <div className="min-h-svh bg-[#f5f5f5]">
            <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f5f5f5]/95 backdrop-blur">
                <div className="mx-auto grid h-16 max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-6">
                    <div className="flex min-w-0 items-center gap-1 justify-self-start">
                        <button
                            type="button"
                            aria-label="返回"
                            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-black/5"
                            onClick={() => navigate(getNovelPagePath())}
                        >
                            <ChevronLeft className="size-5" strokeWidth={1.8} />
                        </button>

                        <ProjectEditableTitle
                            projectId={numericProjectId}
                            title={project.title}
                            onTitleChange={updateProjectTitle}
                            onSaveError={setToastMessage}
                        />
                    </div>

                    <ProjectStepBar
                        steps={steps}
                        activeStep={activeStep}
                        onStepChange={setActiveStep}
                    />

                    <div aria-hidden className="justify-self-end" />
                </div>
            </header>

            <main>
                {activeStep === "outline" ? (
                    <ProjectOutlineStep
                        projectId={numericProjectId}
                        onProjectTitleChange={updateProjectTitle}
                    />
                ) : null}

                {activeStep === "assets" ? (
                    <ProjectAssetStep
                        projectId={numericProjectId}
                        initialTabCounts={project.assetTabCounts}
                    />
                ) : null}

                {activeStep === "episodes" ? (
                    <ProjectEpisodeStep projectId={numericProjectId} />
                ) : null}
            </main>

            <TopCenterToast
                message={toastMessage}
                variant="error"
                onClose={() => setToastMessage("")}
            />
        </div>
    );
}
