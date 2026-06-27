// AI 生剧本 Tab：故事输入框与底部配置选择器
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { createScriptDraft } from "@/api/script";
import { ApiError } from "@/api/types";
import { NovelEpisodeCountPopover } from "@/components/novel/NovelEpisodeCountPopover";
import { ImageStylePopover } from "@/components/prompt/ImageStylePopover";
import { Button } from "@/components/ui/button";
import type { ImageStyleId } from "@/lib/imageStyles";
import { getProjectPagePath } from "@/lib/projectPaths";
import { cn } from "@/lib/utils";

// CREATIVE_MIN_LENGTH 原始创意最少字数（与后端校验一致）
const CREATIVE_MIN_LENGTH = 20;

// 渲染 AI 生剧本 Tab 内容区
export function NovelAiTabContent() {
    const navigate = useNavigate();
    // storyText 故事输入内容
    const [storyText, setStoryText] = useState("");
    // episodeCount 目标集数
    const [episodeCount, setEpisodeCount] = useState(12);
    // imageStyleId 画面风格
    const [imageStyleId, setImageStyleId] = useState<ImageStyleId | undefined>();
    // creating 是否正在创建剧本草稿
    const [creating, setCreating] = useState(false);
    // errorMessage 创建失败提示
    const [errorMessage, setErrorMessage] = useState("");
    // canGenerate 是否可点击立即生成
    const canGenerate = storyText.trim().length >= CREATIVE_MIN_LENGTH && !creating;

    // 立即创建项目与剧本草稿，并跳转剧情大纲页
    const handleGenerate = async () => {
        const creative = storyText.trim();

        if (creative.length < CREATIVE_MIN_LENGTH) {
            setErrorMessage(`故事内容至少 ${CREATIVE_MIN_LENGTH} 字`);
            return;
        }

        setCreating(true);
        setErrorMessage("");

        try {
            const draft = await createScriptDraft({
                creative,
                episodeCount,
                imageStyleId,
            });

            navigate(getProjectPagePath(draft.projectId), {
                state: { activeStep: "outline" as const },
            });
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : "创建剧本失败，请稍后重试";

            setErrorMessage(message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="xyq-novel-ai-panel flex h-full min-h-0 flex-col gap-3">
            <textarea
                value={storyText}
                onChange={(event) => setStoryText(event.target.value)}
                placeholder="在此输入你构想的故事内容。可以尝试输入这些要素：故事设定、主角特征、剧情脉络、最终结局等等"
                className="xyq-novel-textarea h-[144px] w-full shrink-0 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-300"
                disabled={creating}
            />

            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center">
                    <ImageStylePopover
                        value={imageStyleId}
                        onValueChange={setImageStyleId}
                        panelTitle="画面风格"
                        triggerFallbackLabel="风格库"
                        triggerIcon={BookOpen}
                        triggerVariant="toolbar"
                        showDivider
                        popoverPlacement="top"
                    />
                    <NovelEpisodeCountPopover
                        value={episodeCount}
                        onValueChange={setEpisodeCount}
                    />
                </div>

                <Button
                    type="button"
                    disabled={!canGenerate}
                    onClick={() => void handleGenerate()}
                    className={cn(
                        "h-9 shrink-0 rounded-full px-6 text-sm font-medium",
                        canGenerate
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "cursor-not-allowed bg-[#e8e8ec] text-white hover:bg-[#e8e8ec]",
                    )}
                >
                    {creating ? "创建中..." : "立即生成"}
                </Button>
            </div>

            {errorMessage ? (
                <p className="text-xs leading-5 text-red-500">{errorMessage}</p>
            ) : null}
        </div>
    );
}
