// 画布 Redux 状态同步辅助：资产索引与节点索引维护
import type { ProjectAsset } from "@/api/asset";
import { readAssetAppearanceName, readAssetEntityName } from "@/lib/assetParams";
import {
    appendAssetToIndex,
    assetsIndexToList,
    buildAssetsIndex,
    mergeAssetsInIndex,
    removeAssetsFromIndex,
    type CanvasAssetsIndex,
} from "@/lib/canvasAssetsIndex";
import { buildCanvasNodeIndexes } from "@/lib/canvasNodeIndex";
import type { CanvasAssetNodeData, CanvasState } from "@/store/types/canvas";

// 同步 nodeIdSet 与 nodeIndexByAssetId
export function syncCanvasNodeIndexes(state: CanvasState): void {
    const indexes = buildCanvasNodeIndexes(state.nodes);
    state.nodeIdSet = indexes.nodeIdSet;
    state.nodeIndexByAssetId = indexes.nodeIndexByAssetId;
}

// 全量替换资产索引
export function setCanvasAssets(state: CanvasState, assets: ProjectAsset[]): void {
    const index = buildAssetsIndex(assets);
    state.assetsById = index.assetsById;
    state.assetIds = index.assetIds;
}

// 写入或更新单个资产
export function upsertCanvasAsset(state: CanvasState, asset: ProjectAsset): void {
    const next = appendAssetToIndex(
        { assetsById: state.assetsById, assetIds: state.assetIds },
        asset,
    );
    state.assetsById = next.assetsById;
    state.assetIds = next.assetIds;
}

// 批量合并资产（仅替换变更 id）
export function mergeCanvasAssets(state: CanvasState, assets: ProjectAsset[]): void {
    if (assets.length === 0) {
        return;
    }

    const updates = new Map(assets.map((asset) => [asset.id, asset]));
    const next = mergeAssetsInIndex(
        { assetsById: state.assetsById, assetIds: state.assetIds },
        updates,
    );
    state.assetsById = next.assetsById;
    state.assetIds = next.assetIds;
}

// 从索引移除资产
export function removeCanvasAssetsByIds(state: CanvasState, assetIds: number[]): void {
    const next = removeAssetsFromIndex(
        { assetsById: state.assetsById, assetIds: state.assetIds },
        assetIds,
    );
    state.assetsById = next.assetsById;
    state.assetIds = next.assetIds;
}

// 读取资产列表（兼容旧接口）
export function getCanvasAssetsList(state: CanvasState): ProjectAsset[] {
    return assetsIndexToList(getCanvasAssetsIndex(state));
}

// 获取当前资产索引视图
export function getCanvasAssetsIndex(state: CanvasState): CanvasAssetsIndex {
    return { assetsById: state.assetsById, assetIds: state.assetIds };
}

// 按 assetId 局部更新节点 data
export function patchCanvasNodeDataByAssetId(
    state: CanvasState,
    assetId: number,
    dataPatch: Partial<CanvasAssetNodeData>,
): void {
    const idx = state.nodeIndexByAssetId[assetId];

    if (idx === undefined) {
        return;
    }

    const node = state.nodes[idx];
    state.nodes[idx] = {
        ...node,
        data: { ...node.data, ...dataPatch },
    };
}

// 将资料更新同步到资产与对应节点 data
export function applyCharacterProfileUpdatesToState(
    state: CanvasState,
    assets: ProjectAsset[],
): void {
    mergeCanvasAssets(state, assets);

    for (const asset of assets) {
        const entityName = readAssetEntityName(asset);
        const appearanceName = readAssetAppearanceName(asset);

        patchCanvasNodeDataByAssetId(state, asset.id, {
            label:
                asset.type === "character"
                    ? (appearanceName ?? state.assetsById[asset.id]?.name ?? "基础形象")
                    : (entityName ?? asset.name ?? "未命名"),
            ...(entityName && asset.type === "character" ? { characterName: entityName } : {}),
        });
    }

    state.saveStatusVisible = true;
    state.errorMessage = "";
}

// 将媒体更新同步到资产与对应节点 mediaUrl
export function applyAssetMediaUpdateToState(
    state: CanvasState,
    payload: { assetId: number; asset: ProjectAsset },
): void {
    upsertCanvasAsset(state, payload.asset);
    patchCanvasNodeDataByAssetId(state, payload.assetId, {
        mediaUrl: payload.asset.url,
    });
    state.saveStatusVisible = true;
    state.errorMessage = "";
}
