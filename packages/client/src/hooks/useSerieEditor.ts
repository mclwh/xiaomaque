// 分集编辑页：加载分集详情与分镜列表
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchSerieDetail, type ProjectSerie } from "@/api/serie";
import { isAbortError } from "@/lib/isAbortError";
import {
    parseSerieFragments,
    resolveInitialFragmentId,
    type SerieFragment,
} from "@/lib/serieFragments";

// 加载分集编辑数据并管理当前选中分镜
export function useSerieEditor(projectId: number, serieId: number) {
    const enabled =
        Number.isFinite(projectId) && projectId > 0 && Number.isFinite(serieId) && serieId > 0;
    const [searchParams] = useSearchParams();
    // serie 当前分集详情
    const [serie, setSerie] = useState<ProjectSerie | null>(null);
    // loading 详情加载中
    const [loading, setLoading] = useState(false);
    // errorMessage 加载失败文案
    const [errorMessage, setErrorMessage] = useState("");
    // selectedFragmentId 当前选中分镜 ID
    const [selectedFragmentId, setSelectedFragmentId] = useState<string | null>(null);

    // fragmentIdFromQuery URL 中指定要选中的分镜 ID
    const fragmentIdFromQuery = searchParams.get("fragment_id");

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        setErrorMessage("");
        setSerie(null);
        setSelectedFragmentId(null);

        fetchSerieDetail(projectId, serieId, controller.signal)
            .then((detail) => {
                setSerie(detail);
            })
            .catch((error) => {
                if (isAbortError(error)) {
                    return;
                }

                setErrorMessage("加载分集详情失败");
            })
            .finally(() => {
                setLoading(false);
            });

        return () => {
            controller.abort();
        };
    }, [enabled, projectId, serieId]);

    // fragments 解析后的分镜列表
    const fragments = useMemo(
        () => (serie ? parseSerieFragments(serie.fragments) : []),
        [serie],
    );

    useEffect(() => {
        if (!serie || fragments.length === 0) {
            setSelectedFragmentId(null);
            return;
        }

        setSelectedFragmentId((current) => {
            if (current && fragments.some((fragment) => fragment.id === current)) {
                return current;
            }

            return resolveInitialFragmentId(fragments, fragmentIdFromQuery);
        });
    }, [fragments, serie, fragmentIdFromQuery]);

    // selectedFragment 当前选中分镜
    const selectedFragment = useMemo(
        () => fragments.find((fragment) => fragment.id === selectedFragmentId) ?? null,
        [fragments, selectedFragmentId],
    );

    // 清除加载失败提示
    const clearError = useCallback(() => {
        setErrorMessage("");
    }, []);

    // 应用保存后的分集详情
    const applySerie = useCallback((nextSerie: ProjectSerie) => {
        setSerie(nextSerie);
    }, []);

    return {
        serie,
        fragments,
        selectedFragment,
        selectedFragmentId,
        setSelectedFragmentId,
        loading: enabled && loading,
        errorMessage,
        clearError,
        applySerie,
        setErrorMessage,
    };
}
