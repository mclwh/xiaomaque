// 分集编辑页：全屏分镜脚本编辑
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EpisodeEditAssetSidebar } from "@/components/episode/EpisodeEditAssetSidebar";
import { EpisodeEditVideoPanel } from "@/components/episode/EpisodeEditVideoPanel";
import { EpisodeEditHeader } from "@/components/episode/EpisodeEditHeader";
import { EpisodeEditPreview } from "@/components/episode/EpisodeEditPreview";
import { EpisodeEditStoryboardList } from "@/components/episode/EpisodeEditStoryboardList";
import { generateSerieFragment, updateProjectSerieFragments, updateProjectSerieVideoGeneration, type ProjectSerie } from "@/api/serie";
import { TopCenterToast } from "@/components/ui/top-center-toast";
import { TopRightNotice } from "@/components/ui/top-right-notice";
import { useSerieEditor } from "@/hooks/useSerieEditor";
import { useSerieFragmentGenerationPoller } from "@/hooks/useSerieFragmentGenerationPoller";
import type { VideoAspectRatioId, VideoResolution } from "@/lib/generationOptions";
import type { ImageStyleId } from "@/lib/imageStyles";
import { getProjectPagePath } from "@/lib/projectPaths";
import type { SerieFragment } from "@/lib/serieFragments";
import {
    createStoryboardFragment,
    duplicateStoryboardFragment,
    parseSerieFragmentDbId,
    parseSerieFragments,
    serializeSerieFragments,
} from "@/lib/serieFragments";
import { resolveSerieEditableSubtitle } from "@/lib/serieEpisode";
import {
    resolveSerieVideoGenerationDefaults,
    type SerieVideoGenerationSettings,
} from "@/lib/serieVideoGeneration";
import { upsertSerieFragmentGenerationTask } from "@/lib/serieFragmentGenerationTask";

// 格式化编辑页标题
function formatSerieEditorTitle(serie: NonNullable<ReturnType<typeof useSerieEditor>["serie"]>) {
    const subtitle = resolveSerieEditableSubtitle(serie);

    if (subtitle && subtitle !== serie.name.trim()) {
        return `${serie.name}：${subtitle}`;
    }

    return serie.name;
}

// 按索引将保存前的分镜草稿映射到服务端返回的新 ID
function remapFragmentDraftsAfterSave(
    previousFragments: SerieFragment[],
    savedFragments: SerieFragment[],
    contents: Record<string, string>,
    references: Record<string, unknown[]>,
) {
    // nextContents 重映射后的 content 草稿
    const nextContents: Record<string, string> = {};
    // nextReferences 重映射后的 reference 草稿
    const nextReferences: Record<string, unknown[]> = {};

    savedFragments.forEach((fragment, index) => {
        const previous = previousFragments[index];
        const previousId = previous?.id ?? fragment.id;

        nextContents[fragment.id] = contents[previousId] ?? fragment.content;
        nextReferences[fragment.id] = references[previousId] ?? fragment.reference;
    });

    return { nextContents, nextReferences };
}

// 渲染分集编辑页
export function EpisodeEditPage() {
    const navigate = useNavigate();
    const { projectId, serieId } = useParams<{ projectId: string; serieId: string }>();
    // numericProjectId 项目 ID
    const numericProjectId = Number(projectId);
    // numericSerieId 分集 ID
    const numericSerieId = Number(serieId);
    const {
        serie,
        fragments,
        selectedFragmentId,
        setSelectedFragmentId,
        loading,
        errorMessage,
        clearError,
        applySerie,
        setErrorMessage,
    } = useSerieEditor(numericProjectId, numericSerieId);
    // storyboardFragments 本地分镜列表（支持增删复制）
    const [storyboardFragments, setStoryboardFragments] = useState<SerieFragment[]>([]);
    // savedContentsByFragmentId 各分镜已保存脚本
    const [savedContentsByFragmentId, setSavedContentsByFragmentId] = useState<
        Record<string, string>
    >({});
    // savedReferencesByFragmentId 各分镜已保存引用
    const [savedReferencesByFragmentId, setSavedReferencesByFragmentId] = useState<
        Record<string, unknown[]>
    >({});
    // isSavingContent 分镜保存中
    const [isSavingContent, setIsSavingContent] = useState(false);
    // isSubmittingFragment 分镜生成任务提交中
    const [isSubmittingFragment, setIsSubmittingFragment] = useState(false);
    // generationFailureNotice 生成失败通知（仅手动关闭）
    const [generationFailureNotice, setGenerationFailureNotice] = useState("");
    // errorNotifyKey 强制重复展示相同错误 toast
    const [errorNotifyKey, setErrorNotifyKey] = useState(0);
    // videoGeneration 分集视频生成参数（模型、比例、分辨率）
    const [videoGeneration, setVideoGeneration] = useState<SerieVideoGenerationSettings>(() =>
        resolveSerieVideoGenerationDefaults(null),
    );

    // serieSyncKey 分集数据同步键（避免与 persist 内重复 setState，仅在服务端数据变更时同步）
    const serieSyncKey = serie ? `${numericSerieId}:${serie.updatedAt}` : null;

    useEffect(() => {
        if (!serie) {
            return;
        }

        setVideoGeneration(resolveSerieVideoGenerationDefaults(serie.params));
    }, [serie, serieSyncKey]);

    useEffect(() => {
        if (!serieSyncKey) {
            return;
        }

        setStoryboardFragments(fragments);
        setSavedContentsByFragmentId(
            Object.fromEntries(fragments.map((fragment) => [fragment.id, fragment.content])),
        );
        setSavedReferencesByFragmentId(
            Object.fromEntries(fragments.map((fragment) => [fragment.id, fragment.reference])),
        );
    }, [fragments, serieSyncKey]);

    // 展示校验失败 toast（notifyKey 保证重复触发）
    const handleSaveValidationError = useCallback(
        (message: string) => {
            setErrorNotifyKey((key) => key + 1);
            setErrorMessage(message);
        },
        [setErrorMessage],
    );

    // 合并各分镜本地草稿到分镜列表（增删复制等场景）
    const mergeStoryboardFragmentDrafts = useCallback(
        (fragmentList: SerieFragment[]) =>
            fragmentList.map((fragment) => ({
                ...fragment,
                content: savedContentsByFragmentId[fragment.id] ?? fragment.content,
                reference: savedReferencesByFragmentId[fragment.id] ?? fragment.reference,
            })),
        [savedContentsByFragmentId, savedReferencesByFragmentId],
    );

    // 持久化分镜列表（nextFragments 须已包含最新 content / reference）
    const persistStoryboardFragments = useCallback(
        async (nextFragments: SerieFragment[]) => {
            setIsSavingContent(true);
            setErrorMessage("");

            try {
                const updatedSerie = await updateProjectSerieFragments({
                    project_id: numericProjectId,
                    serie_id: numericSerieId,
                    fragments: serializeSerieFragments(nextFragments),
                });
                const savedFragments = parseSerieFragments(updatedSerie.fragments);
                const { nextContents, nextReferences } = remapFragmentDraftsAfterSave(
                    nextFragments,
                    savedFragments,
                    savedContentsByFragmentId,
                    savedReferencesByFragmentId,
                );

                setSavedContentsByFragmentId(nextContents);
                setSavedReferencesByFragmentId(nextReferences);
                setSelectedFragmentId((currentId) => {
                    const selectedIndex = nextFragments.findIndex((fragment) => fragment.id === currentId);

                    if (selectedIndex >= 0) {
                        return savedFragments[selectedIndex]?.id ?? currentId;
                    }

                    return savedFragments[0]?.id ?? currentId;
                });
                applySerie(updatedSerie);
            } catch {
                setErrorMessage("分镜保存失败");
                throw new Error("分镜保存失败");
            } finally {
                setIsSavingContent(false);
            }
        },
        [
            applySerie,
            numericProjectId,
            numericSerieId,
            savedContentsByFragmentId,
            savedReferencesByFragmentId,
            setErrorMessage,
            setSelectedFragmentId,
        ],
    );

    // 持久化视频生成参数（模型、比例、分辨率）
    const persistVideoGeneration = useCallback(
        async (nextVideoGeneration: SerieVideoGenerationSettings) => {
            setErrorMessage("");

            try {
                const updatedSerie = await updateProjectSerieVideoGeneration({
                    project_id: numericProjectId,
                    serie_id: numericSerieId,
                    model_id: nextVideoGeneration.modelId,
                    aspect_ratio: nextVideoGeneration.aspectRatio,
                    resolution: nextVideoGeneration.resolution,
                    video_style_id: nextVideoGeneration.videoStyleId,
                });

                applySerie(updatedSerie);
            } catch {
                setErrorMessage("视频参数保存失败");
            }
        },
        [applySerie, numericProjectId, numericSerieId, setErrorMessage],
    );

    // 更新视频模型并保存
    const handleVideoModelIdChange = useCallback(
        (modelId: string) => {
            const nextVideoGeneration = { ...videoGeneration, modelId };

            setVideoGeneration(nextVideoGeneration);
            void persistVideoGeneration(nextVideoGeneration);
        },
        [persistVideoGeneration, videoGeneration],
    );

    // 更新视频比例并保存
    const handleVideoAspectRatioChange = useCallback(
        (aspectRatio: VideoAspectRatioId) => {
            const nextVideoGeneration = { ...videoGeneration, aspectRatio };

            setVideoGeneration(nextVideoGeneration);
            void persistVideoGeneration(nextVideoGeneration);
        },
        [persistVideoGeneration, videoGeneration],
    );

    // 更新视频分辨率并保存
    const handleVideoResolutionChange = useCallback(
        (resolution: VideoResolution) => {
            const nextVideoGeneration = { ...videoGeneration, resolution };

            setVideoGeneration(nextVideoGeneration);
            void persistVideoGeneration(nextVideoGeneration);
        },
        [persistVideoGeneration, videoGeneration],
    );

    // 更新视频风格并保存
    const handleVideoStyleIdChange = useCallback(
        (videoStyleId: ImageStyleId | undefined) => {
            const nextVideoGeneration = { ...videoGeneration, videoStyleId };

            setVideoGeneration(nextVideoGeneration);
            void persistVideoGeneration(nextVideoGeneration);
        },
        [persistVideoGeneration, videoGeneration],
    );

    // 生成成功后刷新分集与分镜列表
    const handleGenerationSucceeded = useCallback(
        (nextSerie: ProjectSerie) => {
            const savedFragments = parseSerieFragments(nextSerie.fragments);

            applySerie(nextSerie);
            setStoryboardFragments(savedFragments);
            setSavedContentsByFragmentId(
                Object.fromEntries(savedFragments.map((fragment) => [fragment.id, fragment.content])),
            );
            setSavedReferencesByFragmentId(
                Object.fromEntries(savedFragments.map((fragment) => [fragment.id, fragment.reference])),
            );
        },
        [applySerie],
    );

    // 生成失败后展示右上角通知
    const handleGenerationFailed = useCallback((message: string) => {
        setGenerationFailureNotice(message);
    }, []);

    const { isFragmentGenerating, refreshPolling } = useSerieFragmentGenerationPoller({
        projectId: numericProjectId,
        serieId: numericSerieId,
        enabled: Number.isFinite(numericProjectId) && Number.isFinite(numericSerieId),
        onSucceeded: handleGenerationSucceeded,
        onFailed: handleGenerationFailed,
    });

    // selectedFragmentDbId 当前选中分镜的数据库 ID
    const selectedFragmentDbId = useMemo(
        () => parseSerieFragmentDbId(selectedFragmentId ?? ""),
        [selectedFragmentId],
    );

    // activeFragment 当前选中分镜
    const activeFragment = useMemo(
        () => storyboardFragments.find((fragment) => fragment.id === selectedFragmentId) ?? null,
        [selectedFragmentId, storyboardFragments],
    );

    // isGeneratingSelectedFragment 当前分镜是否处于生成中
    const isGeneratingSelectedFragment =
        isSubmittingFragment ||
        (selectedFragmentDbId ? isFragmentGenerating(selectedFragmentDbId) : false);

    // selectedFragmentIndex 当前选中分镜在列表中的索引
    const selectedFragmentIndex = useMemo(
        () => storyboardFragments.findIndex((fragment) => fragment.id === selectedFragmentId),
        [selectedFragmentId, storyboardFragments],
    );

    // storyboardFragmentsWithDrafts 合并本地草稿后的分镜列表（用于底栏展示时长等）
    const storyboardFragmentsWithDrafts = useMemo(
        () => mergeStoryboardFragmentDrafts(storyboardFragments),
        [mergeStoryboardFragmentDrafts, storyboardFragments],
    );

    // selectedFragmentWithDraft 合并本地草稿后的当前分镜
    const selectedFragmentWithDraft = useMemo(() => {
        if (!activeFragment) {
            return null;
        }

        return {
            ...activeFragment,
            content: savedContentsByFragmentId[activeFragment.id] ?? activeFragment.content,
            reference:
                savedReferencesByFragmentId[activeFragment.id] ?? activeFragment.reference,
        };
    }, [activeFragment, savedContentsByFragmentId, savedReferencesByFragmentId]);

    // 保存当前分镜脚本与引用到服务端
    const handleSaveFragmentContent = useCallback(
        async (
            fragmentId: string,
            payload: { content: string; reference: unknown[] },
        ) => {
            const nextFragments = storyboardFragments.map((fragment) => ({
                ...fragment,
                content:
                    fragment.id === fragmentId
                        ? payload.content
                        : (savedContentsByFragmentId[fragment.id] ?? fragment.content),
                reference:
                    fragment.id === fragmentId
                        ? payload.reference
                        : (savedReferencesByFragmentId[fragment.id] ?? fragment.reference),
            }));

            await persistStoryboardFragments(nextFragments);
        },
        [
            persistStoryboardFragments,
            savedContentsByFragmentId,
            savedReferencesByFragmentId,
            storyboardFragments,
        ],
    );

    // 触发当前分镜生成
    const handleGenerateFragment = useCallback(async () => {
        if (!selectedFragmentWithDraft) {
            return;
        }

        const fragmentId = parseSerieFragmentDbId(selectedFragmentWithDraft.id);

        if (!fragmentId) {
            handleSaveValidationError("请先保存分镜后再生成");
            return;
        }

        setIsSubmittingFragment(true);
        setErrorMessage("");

        try {
            const result = await generateSerieFragment({
                project_id: numericProjectId,
                serie_id: numericSerieId,
                fragment_id: fragmentId,
                content: selectedFragmentWithDraft.content,
                model_id: videoGeneration.modelId,
                aspect_ratio: videoGeneration.aspectRatio,
                resolution: videoGeneration.resolution,
                video_style_id: videoGeneration.videoStyleId,
            });

            upsertSerieFragmentGenerationTask({
                projectId: numericProjectId,
                serieId: numericSerieId,
                fragmentId,
                taskId: result.taskId,
                createdAt: Date.now(),
            });
            void refreshPolling();
        } catch {
            setErrorMessage("提交生成任务失败");
        } finally {
            setIsSubmittingFragment(false);
        }
    }, [
        handleSaveValidationError,
        numericProjectId,
        numericSerieId,
        refreshPolling,
        selectedFragmentWithDraft,
        setErrorMessage,
        videoGeneration.aspectRatio,
        videoGeneration.modelId,
        videoGeneration.resolution,
        videoGeneration.videoStyleId,
    ]);

    // 更新当前分镜 content 草稿（切换分镜时由编辑区回写）
    const handleContentDraftChange = useCallback((fragmentId: string, content: string) => {
        setSavedContentsByFragmentId((current) => ({
            ...current,
            [fragmentId]: content,
        }));
    }, []);

    // 更新当前分镜 reference 草稿（选中 @ 引用时）
    const handleFragmentReferenceChange = useCallback(
        (reference: unknown[]) => {
            if (!selectedFragmentId) {
                return;
            }

            setSavedReferencesByFragmentId((current) => ({
                ...current,
                [selectedFragmentId]: reference,
            }));
        },
        [selectedFragmentId],
    );

    // 在指定位置插入空白分镜并保存
    const handleInsertFragment = useCallback(
        async (index: number) => {
            const newFragment = createStoryboardFragment();
            const nextFragments = [...storyboardFragments];
            nextFragments.splice(index, 0, newFragment);

            setSavedContentsByFragmentId((current) => ({
                ...current,
                [newFragment.id]: "",
            }));
            setSavedReferencesByFragmentId((current) => ({
                ...current,
                [newFragment.id]: [],
            }));
            setSelectedFragmentId(newFragment.id);

            try {
                await persistStoryboardFragments(
                    mergeStoryboardFragmentDrafts(
                        nextFragments.map((fragment) =>
                            fragment.id === newFragment.id
                                ? { ...fragment, content: "" }
                                : fragment,
                        ),
                    ),
                );
            } catch {
                setStoryboardFragments(storyboardFragments);
                setSelectedFragmentId(selectedFragmentId);
            }
        },
        [
            mergeStoryboardFragmentDrafts,
            persistStoryboardFragments,
            selectedFragmentId,
            setSelectedFragmentId,
            storyboardFragments,
        ],
    );

    // 删除指定分镜并保存
    const handleDeleteFragment = useCallback(
        async (index: number) => {
            if (storyboardFragments.length <= 1) {
                return;
            }

            const removed = storyboardFragments[index];
            const nextFragments = storyboardFragments.filter(
                (_, fragmentIndex) => fragmentIndex !== index,
            );
            const nextSelectedId =
                removed?.id === selectedFragmentId
                    ? (nextFragments[Math.min(index, nextFragments.length - 1)]?.id ?? null)
                    : selectedFragmentId;

            if (nextSelectedId !== selectedFragmentId) {
                setSelectedFragmentId(nextSelectedId);
            }

            try {
                await persistStoryboardFragments(mergeStoryboardFragmentDrafts(nextFragments));
            } catch {
                setSelectedFragmentId(selectedFragmentId);
            }
        },
        [
            mergeStoryboardFragmentDrafts,
            persistStoryboardFragments,
            selectedFragmentId,
            setSelectedFragmentId,
            storyboardFragments,
        ],
    );

    // 复制指定分镜并插入其后，随后保存
    const handleDuplicateFragment = useCallback(
        async (index: number) => {
            const source = storyboardFragments[index];

            if (!source) {
                return;
            }

            const copy = duplicateStoryboardFragment({
                ...source,
                content: savedContentsByFragmentId[source.id] ?? source.content,
            });
            const nextFragments = [...storyboardFragments];
            nextFragments.splice(index + 1, 0, copy);

            setSavedContentsByFragmentId((drafts) => ({
                ...drafts,
                [copy.id]: copy.content,
            }));
            setSavedReferencesByFragmentId((drafts) => ({
                ...drafts,
                [copy.id]: [...copy.reference],
            }));
            setSelectedFragmentId(copy.id);

            try {
                await persistStoryboardFragments(mergeStoryboardFragmentDrafts(nextFragments));
            } catch {
                setStoryboardFragments(storyboardFragments);
                setSelectedFragmentId(selectedFragmentId);
            }
        },
        [
            mergeStoryboardFragmentDrafts,
            persistStoryboardFragments,
            savedContentsByFragmentId,
            selectedFragmentId,
            setSelectedFragmentId,
            storyboardFragments,
        ],
    );

    // pageTitle 页面标题
    const pageTitle = useMemo(() => {
        if (!serie) {
            return "分集编辑";
        }

        return formatSerieEditorTitle(serie);
    }, [serie]);

    // 返回项目分集列表
    const handleBack = useCallback(() => {
        if (Number.isFinite(numericProjectId) && numericProjectId > 0) {
            navigate(getProjectPagePath(numericProjectId), {
                state: { returnStep: "episodes" as const },
            });
            return;
        }

        navigate(-1);
    }, [navigate, numericProjectId]);

    if (!Number.isFinite(numericProjectId) || numericProjectId <= 0) {
        return (
            <div className="flex h-svh items-center justify-center bg-[#f5f5f5] text-sm text-slate-500">
                项目 ID 无效
            </div>
        );
    }

    if (!Number.isFinite(numericSerieId) || numericSerieId <= 0) {
        return (
            <div className="flex h-svh items-center justify-center bg-[#f5f5f5] text-sm text-slate-500">
                分集 ID 无效
            </div>
        );
    }

    return (
        <div className="flex h-svh flex-col overflow-hidden bg-[#f5f5f5]">
            <EpisodeEditHeader
                title={pageTitle}
                onBack={handleBack}
                videoStyleId={videoGeneration.videoStyleId}
                modelId={videoGeneration.modelId}
                aspectRatio={videoGeneration.aspectRatio}
                videoResolution={videoGeneration.resolution}
                onVideoStyleIdChange={handleVideoStyleIdChange}
                onModelIdChange={handleVideoModelIdChange}
                onAspectRatioChange={handleVideoAspectRatioChange}
                onVideoResolutionChange={handleVideoResolutionChange}
            />

            <TopCenterToast
                message={errorMessage}
                notifyKey={errorNotifyKey}
                variant="error"
                onClose={clearError}
            />

            <TopRightNotice
                message={generationFailureNotice}
                open={Boolean(generationFailureNotice)}
                onClose={() => setGenerationFailureNotice("")}
            />

            {loading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                    加载中...
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex min-h-0 flex-1">
                        <EpisodeEditAssetSidebar
                            projectId={numericProjectId}
                            serieId={numericSerieId}
                        />
                        <EpisodeEditPreview
                            projectId={numericProjectId}
                            serieId={numericSerieId}
                            fragment={selectedFragmentWithDraft}
                            fragmentIndex={selectedFragmentIndex}
                            isSaving={isSavingContent}
                            onContentDraftChange={handleContentDraftChange}
                            onReferenceChange={handleFragmentReferenceChange}
                            onSave={handleSaveFragmentContent}
                            onSaveValidationError={handleSaveValidationError}
                            onGenerate={handleGenerateFragment}
                            isGenerating={isGeneratingSelectedFragment}
                        />
                        <EpisodeEditVideoPanel
                            fragments={storyboardFragmentsWithDrafts}
                            playingFragmentId={selectedFragmentId}
                            onPlayingFragmentChange={setSelectedFragmentId}
                        />
                    </div>
                    <EpisodeEditStoryboardList
                        fragments={storyboardFragmentsWithDrafts}
                        selectedFragmentId={selectedFragmentId}
                        onSelect={setSelectedFragmentId}
                        onInsert={handleInsertFragment}
                        onDelete={handleDeleteFragment}
                        onDuplicate={handleDuplicateFragment}
                    />
                </div>
            )}
        </div>
    );
}
