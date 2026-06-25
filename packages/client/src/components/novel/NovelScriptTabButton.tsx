// 短剧 Agent 文件夹式 Tab 按钮
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NovelScriptTabButtonProps = {
    label: string;
    icon: LucideIcon;
    isActive: boolean;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    hasDivider: boolean;
    disabled?: boolean;
    onClick: () => void;
};

// 返回非激活 Tab 的分层背景色 class
function getInactiveLayerClass(index: number) {
    if (index === 0) {
        return "xyq-novel-tab--layer-0";
    }

    if (index === 1) {
        return "xyq-novel-tab--layer-1";
    }

    return "xyq-novel-tab--layer-2";
}

// 返回左侧相邻未选中 Tab 的背景色，用于顶部圆角衔接
function getJoinLeftFill(index: number) {
    if (index === 1) {
        return "var(--xyq-novel-tab-layer-0)";
    }

    if (index === 2) {
        return "var(--xyq-novel-tab-layer-1)";
    }

    return undefined;
}

// 返回右侧相邻未选中 Tab 的背景色，用于顶部圆角衔接
function getJoinRightFill(index: number) {
    if (index === 0) {
        return "var(--xyq-novel-tab-layer-1)";
    }

    if (index === 1) {
        return "var(--xyq-novel-tab-layer-2)";
    }

    return undefined;
}

// 渲染单个文件夹式 Tab
export function NovelScriptTabButton({
    label,
    icon: Icon,
    isActive,
    index,
    isFirst,
    isLast,
    hasDivider,
    disabled = false,
    onClick,
}: NovelScriptTabButtonProps) {
    // joinLeftFill 左侧相邻 Tab 背景色
    const joinLeftFill = isActive ? getJoinLeftFill(index) : undefined;
    // joinRightFill 右侧相邻 Tab 背景色
    const joinRightFill = isActive ? getJoinRightFill(index) : undefined;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "xyq-novel-tab",
                disabled && "cursor-not-allowed opacity-60",
                isActive
                    ? cn(
                          "xyq-novel-tab--active",
                          isFirst && "xyq-novel-tab--active-first",
                          isLast && "xyq-novel-tab--active-last",
                          !isFirst && "xyq-novel-tab--concave-left",
                          !isLast && "xyq-novel-tab--concave-right",
                      )
                    : cn(
                          getInactiveLayerClass(index),
                          isLast && "xyq-novel-tab--tail",
                          hasDivider && "xyq-novel-tab--divider",
                      ),
            )}
        >
            {joinLeftFill ? (
                <span
                    className="xyq-novel-tab-join xyq-novel-tab-join--left"
                    style={{ ["--xyq-novel-join-fill" as string]: joinLeftFill }}
                    aria-hidden
                />
            ) : null}
            {joinRightFill ? (
                <span
                    className="xyq-novel-tab-join xyq-novel-tab-join--right"
                    style={{ ["--xyq-novel-join-fill" as string]: joinRightFill }}
                    aria-hidden
                />
            ) : null}
            <span className="relative z-[2] inline-flex items-center gap-2">
                <Icon className="size-[18px]" strokeWidth={1.8} />
                {label}
            </span>
        </button>
    );
}
