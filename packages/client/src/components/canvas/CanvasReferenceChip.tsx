// 画布编辑面板中的引用素材缩略图
import { memo } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type CanvasReferenceChipProps = {
    src: string;
    alt?: string;
    onRemove?: () => void;
    className?: string;
};

// 渲染引用素材缩略图卡片
function CanvasReferenceChipComponent({ src, alt = "引用素材", onRemove, className }: CanvasReferenceChipProps) {
    return (
        <div className={cn("relative size-9 shrink-0 overflow-hidden rounded-lg bg-slate-100", className)}>
            <img src={src} alt={alt} className="size-full object-cover" />
            {onRemove ? (
                <button
                    type="button"
                    aria-label="移除引用"
                    onClick={onRemove}
                    className="nodrag absolute right-0.5 top-0.5 inline-flex size-4 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
                >
                    <X className="size-2.5" strokeWidth={2.5} />
                </button>
            ) : null}
        </div>
    );
}

export const CanvasReferenceChip = memo(CanvasReferenceChipComponent);
