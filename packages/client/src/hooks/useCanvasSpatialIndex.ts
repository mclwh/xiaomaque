// 画布空间索引 React Hook：>200 节点时维护 rbush
import { useCallback, useEffect, useRef } from "react";
import type { Node, Viewport } from "@xyflow/react";
import { shouldUseCanvasSpatialIndex } from "@/lib/canvasConfig";
import {
    buildCanvasSpatialIndex,
    insertOrUpdateNode,
    removeNodeFromIndex,
    searchNodesInViewport,
    type CanvasSpatialIndex,
} from "@/lib/canvasSpatialIndex";
import type { CanvasAssetNodeData } from "@/store/types/canvas";

type UseCanvasSpatialIndexOptions = {
    nodes: Node<CanvasAssetNodeData>[];
};

type UseCanvasSpatialIndexResult = {
    isPerformanceMode: boolean;
    spatialIndex: CanvasSpatialIndex | null;
    searchInViewport: (
        viewport: Viewport,
        paneWidth: number,
        paneHeight: number,
    ) => string[];
};

// 维护与 Redux nodes 同步的 R-tree 空间索引
export function useCanvasSpatialIndex({
    nodes,
}: UseCanvasSpatialIndexOptions): UseCanvasSpatialIndexResult {
    const indexRef = useRef<CanvasSpatialIndex | null>(null);
    const prevSnapshotRef = useRef<{
        length: number;
        idsKey: string;
        positionsKey: string;
    } | null>(null);
    const isPerformanceMode = shouldUseCanvasSpatialIndex(nodes.length);

    useEffect(() => {
        if (!isPerformanceMode) {
            indexRef.current = null;
            prevSnapshotRef.current = null;
            return;
        }

        const idsKey = nodes.map((node) => node.id).join(",");
        const positionsKey = nodes
            .map((node) => `${node.id}:${node.position.x},${node.position.y}`)
            .join("|");
        const prev = prevSnapshotRef.current;

        if (!indexRef.current || !prev || prev.length !== nodes.length || prev.idsKey !== idsKey) {
            indexRef.current = buildCanvasSpatialIndex(nodes);
            prevSnapshotRef.current = { length: nodes.length, idsKey, positionsKey };
            return;
        }

        if (prev.positionsKey !== positionsKey) {
            const prevPositions = new Map(
                prev.positionsKey.split("|").map((entry) => {
                    const [id, pos] = entry.split(":");
                    return [id, pos];
                }),
            );

            for (const node of nodes) {
                const prevPos = prevPositions.get(node.id);
                const nextPos = `${node.position.x},${node.position.y}`;

                if (prevPos !== nextPos) {
                    insertOrUpdateNode(indexRef.current, node);
                }
            }

            const currentIds = new Set(nodes.map((node) => node.id));
            for (const id of prevPositions.keys()) {
                if (!currentIds.has(id)) {
                    removeNodeFromIndex(indexRef.current, id);
                }
            }
        }

        prevSnapshotRef.current = { length: nodes.length, idsKey, positionsKey };
    }, [isPerformanceMode, nodes]);

    const searchInViewport = useCallback(
        (viewport: Viewport, paneWidth: number, paneHeight: number) => {
            if (!indexRef.current) {
                return [];
            }

            return searchNodesInViewport(
                indexRef.current,
                viewport,
                paneWidth,
                paneHeight,
            );
        },
        [],
    );

    return {
        isPerformanceMode,
        spatialIndex: isPerformanceMode ? indexRef.current : null,
        searchInViewport,
    };
}
