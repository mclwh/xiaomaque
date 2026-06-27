// 大纲页通用折叠项：标题行 + 可展开内容
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// OutlineAccordionItemProps 折叠项属性
type OutlineAccordionItemProps = {
    title: ReactNode;
    expanded: boolean;
    onToggle: () => void;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    id?: string;
};

// 渲染可折叠大纲区块
export function OutlineAccordionItem({
    title,
    expanded,
    onToggle,
    children,
    className,
    contentClassName,
    id,
}: OutlineAccordionItemProps) {
    return (
        <section id={id} className={cn("border-b border-slate-100 last:border-b-0", className)}>
            <button
                type="button"
                aria-expanded={expanded}
                onClick={onToggle}
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-4 text-left transition hover:bg-slate-50/80"
            >
                <ChevronRight
                    className={cn(
                        "size-4 shrink-0 text-slate-400 transition-transform",
                        expanded ? "rotate-90" : "",
                    )}
                    strokeWidth={2}
                />
                <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{title}</span>
            </button>

            {expanded ? (
                <div className={cn("px-4 pb-5 pt-0", contentClassName)}>{children}</div>
            ) : null}
        </section>
    );
}
