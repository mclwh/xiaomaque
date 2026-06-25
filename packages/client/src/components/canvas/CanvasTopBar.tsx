// 画布顶栏：左上角返回与保存状态，右上角 API KEY 设置
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ArkApiKeySettingsButton } from "@/components/home/ArkApiKeySettingsButton";
import { CanvasToolbarTooltip } from "@/components/canvas/CanvasToolbarTooltip";
import { useAppSelector } from "@/store/hooks";

type CanvasTopBarProps = {
    title?: string;
};

// 渲染画布页顶部工具栏
export function CanvasTopBar({ title = "资产库编辑" }: CanvasTopBarProps) {
    const navigate = useNavigate();
    const saveStatusVisible = useAppSelector((state) => state.canvas.saveStatusVisible);

    return (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-5 pt-5">
            <div className="pointer-events-auto flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <CanvasToolbarTooltip label="返回" side="bottom">
                        <button
                            type="button"
                            aria-label="返回"
                            onClick={() => navigate(-1)}
                            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-black/5 bg-white/95 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
                        >
                            <ChevronLeft className="size-5" strokeWidth={1.8} />
                        </button>
                    </CanvasToolbarTooltip>

                    <span className="text-sm font-medium text-slate-900">{title}</span>

                    {saveStatusVisible ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            已保存
                        </span>
                    ) : null}
                </div>

                <ArkApiKeySettingsButton variant="canvas" tooltipLabel="API KEY" />
            </div>
        </div>
    );
}
