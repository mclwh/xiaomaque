// 画布左下角缩放与撤销控制条
import { useCallback, useState } from "react";
import { LocateFixed, Magnet, Map, Minus, Plus, Redo2, Scan, Undo2 } from "lucide-react";
import { useOnViewportChange, useReactFlow } from "@xyflow/react";
import { CanvasIconButton } from "@/components/canvas/CanvasIconButton";
import { CanvasToolbarTooltip } from "@/components/canvas/CanvasToolbarTooltip";
import { toggleMinimap, toggleSnapToGrid, redoCanvas, selectCanRedo, selectCanUndo, undoCanvas } from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// 渲染画布左下角控制条
export function CanvasBottomControls() {
    const dispatch = useAppDispatch();
    const snapToGrid = useAppSelector((state) => state.canvas.snapToGrid);
    const showMinimap = useAppSelector((state) => state.canvas.showMinimap);
    const canUndo = useAppSelector(selectCanUndo);
    const canRedo = useAppSelector(selectCanRedo);
    const { zoomIn, zoomOut, fitView, setViewport, getViewport } = useReactFlow();
    const [zoomPercent, setZoomPercent] = useState(100);

    // 同步视口缩放到百分比展示
    useOnViewportChange({
        onChange: (viewport) => {
            setZoomPercent(Math.round(viewport.zoom * 100));
        },
    });

    // 重置缩放到 100% 并居中
    const handleResetZoom = useCallback(() => {
        const viewport = getViewport();
        void setViewport({ ...viewport, zoom: 1 }, { duration: 200 });
    }, [getViewport, setViewport]);

    return (
        <div className="pointer-events-none absolute bottom-5 left-5 z-30">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-black/5 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur">
                <CanvasToolbarTooltip label="撤销" side="top">
                    <CanvasIconButton
                        aria-label="撤销"
                        disabled={!canUndo}
                        disabledStyle={!canUndo}
                        onClick={() => dispatch(undoCanvas())}
                    >
                        <Undo2 className="size-4" strokeWidth={1.8} />
                    </CanvasIconButton>
                </CanvasToolbarTooltip>

                <CanvasToolbarTooltip label="重做" side="top">
                    <CanvasIconButton
                        aria-label="重做"
                        disabled={!canRedo}
                        disabledStyle={!canRedo}
                        onClick={() => dispatch(redoCanvas())}
                    >
                        <Redo2 className="size-4" strokeWidth={1.8} />
                    </CanvasIconButton>
                </CanvasToolbarTooltip>

                <span className="mx-1 h-5 w-px bg-slate-200" />

                <CanvasToolbarTooltip label="定位到内容" side="top">
                    <CanvasIconButton aria-label="定位" onClick={() => void fitView({ duration: 200 })}>
                        <LocateFixed className="size-4" strokeWidth={1.8} />
                    </CanvasIconButton>
                </CanvasToolbarTooltip>

                <CanvasToolbarTooltip label="适应画布" side="top">
                    <CanvasIconButton
                        aria-label="适应画布"
                        onClick={() => void fitView({ duration: 200, padding: 0.2 })}
                    >
                        <Scan className="size-4" strokeWidth={1.8} />
                    </CanvasIconButton>
                </CanvasToolbarTooltip>

                <span className="mx-1 h-5 w-px bg-slate-200" />

                <CanvasToolbarTooltip label={snapToGrid ? "关闭网格吸附" : "开启网格吸附"} side="top">
                    <CanvasIconButton
                        aria-label={snapToGrid ? "关闭网格吸附" : "开启网格吸附"}
                        aria-pressed={snapToGrid}
                        active={snapToGrid}
                        onClick={() => dispatch(toggleSnapToGrid())}
                    >
                        <Magnet className="size-4" strokeWidth={1.8} />
                    </CanvasIconButton>
                </CanvasToolbarTooltip>

                <CanvasToolbarTooltip label={showMinimap ? "关闭小地图" : "开启小地图"} side="top">
                    <CanvasIconButton
                        aria-label={showMinimap ? "关闭小地图" : "开启小地图"}
                        aria-pressed={showMinimap}
                        active={showMinimap}
                        onClick={() => dispatch(toggleMinimap())}
                    >
                        <Map className="size-4" strokeWidth={1.8} />
                    </CanvasIconButton>
                </CanvasToolbarTooltip>

                <span className="mx-1 h-5 w-px bg-slate-200" />

                <CanvasToolbarTooltip label="缩小" side="top">
                    <CanvasIconButton aria-label="缩小" onClick={() => zoomOut({ duration: 150 })}>
                        <Minus className="size-4" strokeWidth={1.8} />
                    </CanvasIconButton>
                </CanvasToolbarTooltip>

                <CanvasToolbarTooltip label="重置缩放" side="top">
                    <button
                        type="button"
                        aria-label="重置缩放"
                        onClick={handleResetZoom}
                        className="min-w-12 cursor-pointer px-1 text-sm font-medium text-slate-700"
                    >
                        {zoomPercent}%
                    </button>
                </CanvasToolbarTooltip>

                <CanvasToolbarTooltip label="放大" side="top">
                    <CanvasIconButton aria-label="放大" onClick={() => zoomIn({ duration: 150 })}>
                        <Plus className="size-4" strokeWidth={1.8} />
                    </CanvasIconButton>
                </CanvasToolbarTooltip>
            </div>
        </div>
    );
}
