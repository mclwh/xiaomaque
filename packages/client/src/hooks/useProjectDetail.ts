// 获取项目详情并推导工作流步骤
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProjectDetail } from "@/api/project";
import { useAsyncRequest } from "@/hooks/useAsyncRequest";
import {
    buildProjectSteps,
    getInitialProjectStep,
    type ProjectStepKey,
} from "@/lib/projectSteps";

// 获取项目详情，并根据 hasScript 构建可见步骤
export function useProjectDetail(projectId: number) {
    const enabled = Number.isFinite(projectId) && projectId > 0;
    const { data, loading, errorMessage, run } = useAsyncRequest(fetchProjectDetail, {
        immediate: true,
        params: projectId,
        enabled,
        defaultErrorMessage: "获取项目详情失败，请稍后重试",
    });
    const [activeStep, setActiveStep] = useState<ProjectStepKey>("assets");
    // localTitle 本地覆盖的项目标题（重命名后即时更新）
    const [localTitle, setLocalTitle] = useState<string | undefined>();

    useEffect(() => {
        setLocalTitle(undefined);
    }, [data?.id, data?.title]);

    const project = useMemo(
        () => (data ? { ...data, title: localTitle ?? data.title } : null),
        [data, localTitle],
    );

    // 更新本地项目标题
    const updateProjectTitleLocal = useCallback((title: string) => {
        setLocalTitle(title);
    }, []);

    useEffect(() => {
        if (!data) {
            return;
        }

        setActiveStep(getInitialProjectStep(data.hasScript));
    }, [data]);

    const steps = useMemo(
        () => buildProjectSteps(data?.hasScript ?? false),
        [data?.hasScript],
    );

    return {
        project,
        steps,
        activeStep,
        setActiveStep,
        loading: enabled && loading,
        errorMessage,
        reload: () => run(projectId),
        updateProjectTitle: updateProjectTitleLocal,
    };
}
