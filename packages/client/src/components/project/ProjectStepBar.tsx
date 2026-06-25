// 项目工作流顶部步骤条
import { ChevronRight } from "lucide-react";
import type { ProjectStepItem, ProjectStepKey } from "@/lib/projectSteps";
import { cn } from "@/lib/utils";

type ProjectStepBarProps = {
    steps: ProjectStepItem[];
    activeStep: ProjectStepKey;
    onStepChange?: (step: ProjectStepKey) => void;
};

// 渲染项目工作流步骤条
export function ProjectStepBar({ steps, activeStep, onStepChange }: ProjectStepBarProps) {
    return (
        <div className="flex items-center gap-2">
            {steps.map((step, index) => {
                const isActive = step.key === activeStep;
                const isCompleted =
                    steps.findIndex((item) => item.key === activeStep) > index;

                return (
                    <div key={step.key} className="flex items-center gap-2">
                        <button
                            type="button"
                            className={cn(
                                "inline-flex cursor-pointer items-center gap-2 rounded-full px-1 py-1 transition",
                                isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600",
                            )}
                            onClick={() => onStepChange?.(step.key)}
                        >
                            <span
                                className={cn(
                                    "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                                    isActive
                                        ? "bg-black text-white"
                                        : isCompleted
                                          ? "bg-slate-200 text-slate-600"
                                          : "bg-slate-100 text-slate-400",
                                )}
                            >
                                {step.order}
                            </span>
                            <span className="text-sm font-medium">{step.label}</span>
                        </button>

                        {index < steps.length - 1 ? (
                            <ChevronRight className="size-4 text-slate-300" strokeWidth={1.8} />
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
