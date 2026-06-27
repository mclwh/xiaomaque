// 剧情大纲页返回顶部按钮
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// SCROLL_THRESHOLD_PX 显示按钮的滚动阈值
const SCROLL_THRESHOLD_PX = 320;

// 滚动超过阈值后显示返回顶部按钮
export function OutlineBackToTop() {
    // visible 是否显示按钮
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    // 平滑滚动到页面顶部
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <button
            type="button"
            aria-label="返回顶部"
            onClick={scrollToTop}
            className={cn(
                "fixed bottom-8 right-6 z-20 inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_8px_24px_rgba(15,23,42,0.2)] transition",
                "hover:bg-slate-800",
                visible
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0",
            )}
        >
            <ArrowUp className="size-5" strokeWidth={2} />
        </button>
    );
}
