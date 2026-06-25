// 角色/场景节点「更多操作」弹层：编辑名称与出现集数
import {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent,
    type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Loader2, MoreHorizontal, RefreshCw } from "lucide-react";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import { CANVAS_NODE_UI } from "@/components/canvas/canvasNodeConfig";
import { handlePromptPopoverMouseDown } from "@/components/prompt/promptPopoverUtils";
import { readAssetEntityName } from "@/lib/assetParams";
import { resolveCharacterAppearanceLabel } from "@/lib/assetDisplay";
import {
    loadCanvasSeries,
    pushCanvasHistorySnapshot,
    selectCanvasAssetById,
    selectCanvasProjectId,
    selectCanvasSeries,
    selectCanvasSeriesLoaded,
    updateCharacterAssetProfile,
} from "@/store/canvasSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

type CanvasAssetMoreActionsPopoverProps = {
    assetId: number;
    kind: CanvasNodeKind;
    anchorRef: RefObject<HTMLElement | null>;
};

// SERIES_LOADING_HIDE_DELAY_MS 接口响应后延迟隐藏 Loading
const SERIES_LOADING_HIDE_DELAY_MS = 500;

// 接口响应后延迟隐藏 Loading
function scheduleHideSeriesLoading(onHide: () => void) {
    return setTimeout(onHide, SERIES_LOADING_HIDE_DELAY_MS);
}

// 根据节点卡片位置计算弹层坐标（悬浮在卡片右侧）
function resolvePopoverPosition(anchor: HTMLElement) {
    const rect = anchor.getBoundingClientRect();

    return {
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
    };
}

// 渲染角色/场景节点更多操作弹层
function CanvasAssetMoreActionsPopoverComponent({
    assetId,
    kind,
    anchorRef,
}: CanvasAssetMoreActionsPopoverProps) {
    const dispatch = useAppDispatch();
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [characterName, setCharacterName] = useState("");
    const [appearanceName, setAppearanceName] = useState("");
    const [selectedSerieIds, setSelectedSerieIds] = useState<Set<number>>(() => new Set());
    const [seriesLoadError, setSeriesLoadError] = useState("");
    // seriesLoading 分集列表加载中
    const [seriesLoading, setSeriesLoading] = useState(false);
    // seriesRefreshing 手动刷新分集中
    const [seriesRefreshing, setSeriesRefreshing] = useState(false);

    const asset = useAppSelector((state) => selectCanvasAssetById(state, assetId));
    const projectId = useAppSelector(selectCanvasProjectId);
    const series = useAppSelector(selectCanvasSeries);
    const seriesLoaded = useAppSelector(selectCanvasSeriesLoaded);
    const isCharacter = kind === "character";
    const config = CANVAS_NODE_UI[kind];

    // 弹层挂到 body 后，需同时监听按钮与弹层内部点击，避免误关闭
    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;

            if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
                return;
            }

            setOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [open]);

    // 打开弹层时定位到节点卡片右侧，并在滚动/缩放时跟随
    const updatePanelPosition = useCallback(() => {
        const anchor = anchorRef.current;

        if (!anchor) {
            return;
        }

        setPanelPosition(resolvePopoverPosition(anchor));
    }, [anchorRef]);

    useLayoutEffect(() => {
        if (!open) {
            return;
        }

        updatePanelPosition();
        window.addEventListener("resize", updatePanelPosition);
        window.addEventListener("scroll", updatePanelPosition, true);

        return () => {
            window.removeEventListener("resize", updatePanelPosition);
            window.removeEventListener("scroll", updatePanelPosition, true);
        };
    }, [open, updatePanelPosition]);

    // 打开弹层时按需拉取分集列表（有缓存则跳过请求）
    useEffect(() => {
        if (!open) {
            setSeriesLoading(false);
            setSeriesLoadError("");
            setSeriesRefreshing(false);
            return;
        }

        if (!projectId) {
            return;
        }

        // 仅在弹层打开时读取缓存，不监听 seriesLoaded 变化，避免请求完成后 effect 重跑立刻清掉 Loading
        if (seriesLoaded) {
            setSeriesLoading(false);
            return;
        }

        // hideTimer 延迟隐藏 Loading 的定时器
        let hideTimer: ReturnType<typeof setTimeout> | undefined;
        const request = dispatch(loadCanvasSeries(projectId));

        void request
            .unwrap()
            .then(() => {
                hideTimer = scheduleHideSeriesLoading(() => {
                    setSeriesLoading(false);
                });
            })
            .catch((error) => {
                if (error === "aborted") {
                    return;
                }

                setSeriesLoadError(typeof error === "string" ? error : "加载集数失败");
                setSeriesLoading(false);
            });

        return () => {
            request.abort();

            if (hideTimer) {
                clearTimeout(hideTimer);
            }
        };
        // seriesLoaded intentionally omitted: 请求完成后不应重跑 effect，否则会立刻清 Loading 并 cancel 定时器
    }, [dispatch, open, projectId]);

    // 手动刷新分集列表
    const handleRefreshSeries = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();

            if (!projectId || seriesLoading) {
                return;
            }

            setSeriesLoading(true);
            setSeriesRefreshing(true);
            setSeriesLoadError("");

            // hideTimer 延迟隐藏 Loading 的定时器
            let hideTimer: ReturnType<typeof setTimeout> | undefined;

            void dispatch(loadCanvasSeries(projectId))
                .unwrap()
                .then(() => {
                    hideTimer = scheduleHideSeriesLoading(() => {
                        setSeriesLoading(false);
                        setSeriesRefreshing(false);
                    });
                })
                .catch((error) => {
                    if (hideTimer) {
                        clearTimeout(hideTimer);
                    }

                    if (error === "aborted") {
                        return;
                    }

                    setSeriesLoadError(typeof error === "string" ? error : "加载集数失败");
                    setSeriesLoading(false);
                    setSeriesRefreshing(false);
                });
        },
        [dispatch, projectId, seriesLoading],
    );

    // 打开弹层时回填当前资料
    useEffect(() => {
        if (!open || !asset) {
            return;
        }

        setCharacterName(readAssetEntityName(asset) ?? "");
        setAppearanceName(resolveCharacterAppearanceLabel(asset, config.footerTitle));
        setSelectedSerieIds(new Set(asset.serieIds ?? []));
        setErrorMessage("");
    }, [asset, config.footerTitle, open]);

    // 阻止事件冒泡到 React Flow
    const stopFlowEvent = useCallback((event: MouseEvent) => {
        event.stopPropagation();
    }, []);

    // 阻止画布拖拽并避免误选中节点
    const handleButtonMouseDown = useCallback((event: MouseEvent) => {
        event.stopPropagation();
        handlePromptPopoverMouseDown(event, "canvas");
    }, []);

    // 切换弹层开关
    const handleToggleOpen = useCallback(
        (event: MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            event.preventDefault();
            setOpen((current) => {
                const willOpen = !current;

                if (willOpen) {
                    if (seriesLoaded) {
                        setSeriesLoading(false);
                    } else {
                        setSeriesLoading(true);
                    }

                    setSeriesLoadError("");
                }

                return willOpen;
            });
        },
        [seriesLoaded],
    );

    // 切换集数选中状态
    const handleToggleSerie = useCallback((serieId: number) => {
        setSelectedSerieIds((current) => {
            const next = new Set(current);

            if (next.has(serieId)) {
                next.delete(serieId);
            } else {
                next.add(serieId);
            }

            return next;
        });
    }, []);

    const sortedSerieIds = useMemo(
        () => [...selectedSerieIds].toSorted((left, right) => left - right),
        [selectedSerieIds],
    );

    // 保存名称与出现集数
    const handleSave = useCallback(async () => {
        if (isSaving) {
            return;
        }

        setIsSaving(true);
        setErrorMessage("");

        try {
            dispatch(pushCanvasHistorySnapshot());
            await dispatch(
                updateCharacterAssetProfile({
                    assetId,
                    ...(isCharacter ? { characterName: characterName.trim() } : {}),
                    appearanceName: appearanceName.trim(),
                    serieIds: sortedSerieIds,
                }),
            ).unwrap();
            setOpen(false);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "资料更新失败");
        } finally {
            setIsSaving(false);
        }
    }, [
        appearanceName,
        assetId,
        characterName,
        dispatch,
        isCharacter,
        isSaving,
        sortedSerieIds,
    ]);

    if (!asset) {
        return null;
    }

    // panelContent 编辑资料弹层（Portal 渲染，避免被节点 overflow 裁剪）
    const panelContent = open ? (
        <div
            ref={panelRef}
            className="nodrag nopan nowheel fixed z-200 w-[280px] -translate-y-1/2 rounded-2xl border border-black/5 bg-white p-3 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
            style={{
                top: panelPosition.top,
                left: panelPosition.left,
            }}
            onMouseDown={stopFlowEvent}
            onPointerDown={stopFlowEvent}
        >
            <p className="px-1 pb-3 text-sm font-medium text-slate-900">编辑资料</p>

            {isCharacter ? (
                <label className="mb-3 block px-1">
                    <span className="mb-1.5 block text-xs text-slate-500">角色名称</span>
                    <input
                        type="text"
                        value={characterName}
                        onChange={(event) => setCharacterName(event.target.value)}
                        placeholder="未命名角色"
                        className="nodrag nopan w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400"
                    />
                </label>
            ) : null}

            <label className="mb-3 block px-1">
                <span className="mb-1.5 block text-xs text-slate-500">
                    {isCharacter ? "形象名称" : "场景名称"}
                </span>
                <input
                    type="text"
                    value={appearanceName}
                    onChange={(event) => setAppearanceName(event.target.value)}
                    placeholder={config.footerTitle}
                    className="nodrag nopan w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400"
                />
            </label>

            <div className="mb-3 px-1">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">出现集数</span>
                    <button
                        type="button"
                        aria-label="刷新集数列表"
                        disabled={seriesLoading}
                        onClick={handleRefreshSeries}
                        onMouseDown={handleButtonMouseDown}
                        onPointerDown={handleButtonMouseDown}
                        className={cn(
                            "nodrag nopan inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600",
                            (seriesLoading || seriesRefreshing) && "cursor-not-allowed opacity-50",
                        )}
                    >
                        <RefreshCw
                            className={cn("size-3.5", seriesRefreshing && "animate-spin")}
                            strokeWidth={1.8}
                        />
                    </button>
                </div>
                {seriesLoading ? (
                    <div className="flex min-h-[72px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
                        <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                        加载中...
                    </div>
                ) : seriesLoadError ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-500">
                        {seriesLoadError}
                    </p>
                ) : series.length > 0 ? (
                    <div className="nodrag nopan nowheel max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                        {series.map((serie) => {
                            const checked = selectedSerieIds.has(serie.id);

                            return (
                                <label
                                    key={serie.id}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleToggleSerie(serie.id)}
                                        className="nodrag nopan size-3.5 accent-black"
                                    />
                                    <span>{serie.name}</span>
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
                        暂无集数，请先在分集模块创建
                    </p>
                )}
            </div>

            {errorMessage ? <p className="mb-2 px-1 text-xs text-red-500">{errorMessage}</p> : null}

            <div className="flex justify-end border-t border-slate-100 pt-3">
                <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                        void handleSave();
                    }}
                    className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition",
                        isSaving
                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                            : "bg-black text-white hover:bg-black/85",
                    )}
                >
                    {isSaving ? <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> : null}
                    保存
                </button>
            </div>
        </div>
    ) : null;

    return (
        <div
            ref={rootRef}
            className="relative"
            onMouseDown={stopFlowEvent}
            onPointerDown={stopFlowEvent}
        >
            <button
                type="button"
                aria-label="更多操作"
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={handleToggleOpen}
                onMouseDown={handleButtonMouseDown}
                onPointerDown={handleButtonMouseDown}
                className="nodrag nopan inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
                <MoreHorizontal className="size-4" strokeWidth={1.8} />
            </button>

            {panelContent ? createPortal(panelContent, document.body) : null}
        </div>
    );
}

export const CanvasAssetMoreActionsPopover = memo(CanvasAssetMoreActionsPopoverComponent);
