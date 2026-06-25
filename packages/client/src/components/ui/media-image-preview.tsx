// 全屏图片预览层：类似 Element Plus Image Viewer，支持缩放、旋转与 Esc 关闭
import { memo, useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaImagePreviewProps = {
    open: boolean;
    src: string;
    alt?: string;
    onClose: () => void;
};

type MediaImagePreviewViewProps = {
    src: string;
    alt: string;
    onClose: () => void;
};

// PanOffset 图片平移偏移量
type PanOffset = {
    x: number;
    y: number;
};

// DragSession 拖拽会话（pointer 按下时的基准点）
type DragSession = {
    startX: number;
    startY: number;
    panX: number;
    panY: number;
};

// PREVIEW_MIN_SCALE 最小缩放比例
const PREVIEW_MIN_SCALE = 0.2;

// PREVIEW_MAX_SCALE 最大缩放比例
const PREVIEW_MAX_SCALE = 5;

// PREVIEW_SCALE_STEP 每次缩放步进
const PREVIEW_SCALE_STEP = 0.25;

// 限制缩放值在合法区间内
function clampScale(value: number) {
    return Math.min(PREVIEW_MAX_SCALE, Math.max(PREVIEW_MIN_SCALE, value));
}

// 渲染预览工具栏按钮
const PreviewToolbarButton = memo(function PreviewToolbarButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={(event) => {
                event.stopPropagation();
                onClick();
            }}
            className={cn(
                "inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-white/90 transition",
                "hover:bg-white/15 hover:text-white",
            )}
        >
            {children}
        </button>
    );
});

// 渲染预览内容区（挂载时初始化缩放/旋转/平移，避免 effect 重置）
function MediaImagePreviewView({ src, alt, onClose }: MediaImagePreviewViewProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [pan, setPan] = useState<PanOffset>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const dragSessionRef = useRef<DragSession | null>(null);
    const panRef = useRef(pan);
    const onCloseRef = useRef(onClose);

    panRef.current = pan;
    onCloseRef.current = onClose;

    // 监听 Esc 关闭预览（onClose 通过 ref 读取，避免 effect 重复订阅）
    useEffect(() => {
        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onCloseRef.current();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // 预览打开时禁止页面滚动
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    // 滚轮缩放绑定弹窗根节点，图片/遮罩/工具栏区域均可缩放（passive: false 才能 preventDefault）
    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) {
            return;
        }

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            event.stopPropagation();

            const delta = event.deltaY > 0 ? -PREVIEW_SCALE_STEP : PREVIEW_SCALE_STEP;
            setScale((current) => clampScale(Number((current + delta).toFixed(2))));
        };

        dialog.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            dialog.removeEventListener("wheel", handleWheel);
        };
    }, []);

    // 阻止事件冒泡，避免触发画布拖拽或选中
    const stopPropagation = (event: MouseEvent) => {
        event.stopPropagation();
    };

    // 点击遮罩关闭预览
    const handleMaskClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onCloseRef.current();
        }
    };

    // 开始拖拽图片（记录起始指针位置与当前平移量）
    const handleImagePointerDown = (event: PointerEvent<HTMLImageElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);

        dragSessionRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            panX: panRef.current.x,
            panY: panRef.current.y,
        };
        setIsDragging(true);
    };

    // 拖拽过程中更新图片平移偏移
    const handleImagePointerMove = (event: PointerEvent<HTMLImageElement>) => {
        const session = dragSessionRef.current;

        if (!session) {
            return;
        }

        setPan({
            x: session.panX + event.clientX - session.startX,
            y: session.panY + event.clientY - session.startY,
        });
    };

    // 结束拖拽并释放 pointer capture
    const handleImagePointerUp = (event: PointerEvent<HTMLImageElement>) => {
        if (!dragSessionRef.current) {
            return;
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        dragSessionRef.current = null;
        setIsDragging(false);
    };

    // 重置缩放、旋转与平移至初始状态
    const handleResetView = () => {
        dragSessionRef.current = null;
        setIsDragging(false);
        setScale(1);
        setRotation(0);
        setPan({ x: 0, y: 0 });
    };

    return (
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${alt} 预览`}
            className="fixed inset-0 z-[120]"
            onMouseDown={stopPropagation}
        >
            <div
                aria-hidden
                className="absolute inset-0 bg-black/80"
                onClick={handleMaskClick}
            />

            <button
                type="button"
                aria-label="关闭预览"
                onClick={(event) => {
                    event.stopPropagation();
                    onCloseRef.current();
                }}
                className="absolute top-5 right-5 z-10 inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
                <X className="size-5" strokeWidth={1.8} />
            </button>

            <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                onClick={stopPropagation}
            >
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    className={cn(
                        "pointer-events-auto max-h-[calc(100vh-120px)] max-w-[calc(100vw-80px)] touch-none select-none object-contain",
                        isDragging ? "cursor-grabbing" : "cursor-grab",
                        !isDragging ? "transition-transform duration-150" : "",
                    )}
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale}) rotate(${rotation}deg)`,
                    }}
                    onClick={stopPropagation}
                    onPointerDown={handleImagePointerDown}
                    onPointerMove={handleImagePointerMove}
                    onPointerUp={handleImagePointerUp}
                    onPointerCancel={handleImagePointerUp}
                />
            </div>

            <div
                className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-sm"
                onClick={stopPropagation}
                onMouseDown={stopPropagation}
            >
                <PreviewToolbarButton
                    label="缩小"
                    onClick={() =>
                        setScale((current) =>
                            clampScale(Number((current - PREVIEW_SCALE_STEP).toFixed(2))),
                        )
                    }
                >
                    <ZoomOut className="size-4" strokeWidth={1.8} />
                </PreviewToolbarButton>
                <PreviewToolbarButton
                    label="放大"
                    onClick={() =>
                        setScale((current) =>
                            clampScale(Number((current + PREVIEW_SCALE_STEP).toFixed(2))),
                        )
                    }
                >
                    <ZoomIn className="size-4" strokeWidth={1.8} />
                </PreviewToolbarButton>
                <PreviewToolbarButton
                    label="逆时针旋转"
                    onClick={() => setRotation((current) => current - 90)}
                >
                    <RotateCcw className="size-4" strokeWidth={1.8} />
                </PreviewToolbarButton>
                <PreviewToolbarButton
                    label="顺时针旋转"
                    onClick={() => setRotation((current) => current + 90)}
                >
                    <RotateCw className="size-4" strokeWidth={1.8} />
                </PreviewToolbarButton>
                <span aria-hidden className="mx-1 h-5 w-px bg-white/15" />
                <PreviewToolbarButton label="重置" onClick={handleResetView}>
                    <RefreshCw className="size-4" strokeWidth={1.8} />
                </PreviewToolbarButton>
            </div>
        </div>
    );
}

// 渲染全屏图片预览弹层（关闭时不挂载内容区）
export function MediaImagePreview({ open, src, alt = "图片预览", onClose }: MediaImagePreviewProps) {
    if (!open) {
        return null;
    }

    return createPortal(
        <MediaImagePreviewView key={src} src={src} alt={alt} onClose={onClose} />,
        document.body,
    );
}
