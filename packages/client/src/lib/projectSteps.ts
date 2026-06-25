// 项目工作流步骤定义与构建逻辑

// ProjectStepKey 项目工作流步骤标识
export type ProjectStepKey = "outline" | "assets" | "episodes";

// ProjectStepItem 步骤展示项
export type ProjectStepItem = {
    key: ProjectStepKey;
    label: string;
    order: number;
};

// 根据是否存在剧情记录构建可见步骤列表
export function buildProjectSteps(hasScript: boolean): ProjectStepItem[] {
    const steps: Array<{ key: ProjectStepKey; label: string }> = hasScript
        ? [
              { key: "outline", label: "剧情大纲" },
              { key: "assets", label: "资产库" },
              { key: "episodes", label: "分集视频" },
          ]
        : [
              { key: "assets", label: "资产库" },
              { key: "episodes", label: "分集视频" },
          ];

    return steps.map((step, index) => ({
        ...step,
        order: index + 1,
    }));
}

// 返回项目页默认激活步骤
export function getInitialProjectStep(hasScript: boolean): ProjectStepKey {
    return hasScript ? "outline" : "assets";
}

// 获取当前步骤在可见步骤中的下一步
export function getNextProjectStep(
    steps: ProjectStepItem[],
    currentStep: ProjectStepKey,
): ProjectStepKey | null {
    const currentIndex = steps.findIndex((step) => step.key === currentStep);

    if (currentIndex < 0 || currentIndex >= steps.length - 1) {
        return null;
    }

    return steps[currentIndex + 1].key;
}
