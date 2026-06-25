// 画布资产生命周期与布局 Thunk：加载、创建、引用、删除、保存布局与资料更新
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
    createAsset,
    createReferencedAsset,
    batchDeleteAssets,
    fetchProjectAssets,
    saveCanvasAssets,
    updateAssetType,
    updateAssetProfile,
} from "@/api/asset";
import { fetchProjectSeries } from "@/api/serie";
import { ApiError } from "@/api/types";
import type { CanvasNodeKind } from "@/components/canvas/canvasTypes";
import {
    buildAssetParamsWithReferenceSource,
    buildAssetParamsWithoutReferenceSource,
} from "@/lib/assetParams";
import {
    parseCanvasNodeId,
    parseCanvasLayoutFromAssets,
    serializeCanvasLayout,
    serializeCanvasToAssetUpdates,
} from "@/lib/canvasNodes";
import { getCanvasAssetsList } from "@/lib/canvasStateHelpers";
import type { CanvasState } from "@/store/types/canvas";

// 加载项目资产并由前端解析画布布局
export const loadCanvasAssets = createAsyncThunk(
    "canvas/loadAssets",
    async (projectId: number, { rejectWithValue, signal }) => {
        try {
            const assets = await fetchProjectAssets(projectId, { signal });
            const layout = parseCanvasLayoutFromAssets(assets);
            return { projectId, assets, layout };
        } catch (error) {
            if (signal.aborted) {
                return rejectWithValue("aborted");
            }

            return rejectWithValue(
                error instanceof ApiError ? error.message : "加载资产失败",
            );
        }
    },
);

// 按需加载项目分集列表（编辑资料弹层打开时触发）
export const loadCanvasSeries = createAsyncThunk(
    "canvas/loadSeries",
    async (projectId: number, { rejectWithValue, signal }) => {
        try {
            return await fetchProjectSeries(projectId, signal);
        } catch (error) {
            if (signal.aborted) {
                return rejectWithValue("aborted");
            }

            return rejectWithValue(
                error instanceof ApiError ? error.message : "加载集数失败",
            );
        }
    },
);

// 为目标节点添加上下文：创建资产并在左侧追加节点与连线
export const createContextCanvasAsset = createAsyncThunk(
    "canvas/createContextAsset",
    async (
        payload: { project_id: number; type: CanvasNodeKind; targetNodeId: string },
        { rejectWithValue },
    ) => {
        try {
            const asset = await createAsset({
                project_id: payload.project_id,
                type: payload.type,
            });

            return {
                asset,
                targetNodeId: payload.targetNodeId,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : "添加上下文失败",
            );
        }
    },
);

// 引用源节点创建资产，并在画布追加节点与连线
export const createReferencedCanvasAsset = createAsyncThunk(
    "canvas/createReferencedAsset",
    async (
        payload: { project_id: number; type: CanvasNodeKind; sourceNodeId: string },
        { rejectWithValue },
    ) => {
        try {
            const sourceAssetId = parseCanvasNodeId(payload.sourceNodeId);

            if (!sourceAssetId) {
                throw new Error("引用源节点无效");
            }

            const result = await createReferencedAsset({
                project_id: payload.project_id,
                type: payload.type,
                source_asset_id: sourceAssetId,
            });

            const paramsWithReference = buildAssetParamsWithReferenceSource(
                result.asset.params,
                sourceAssetId,
            );

            let asset = result.asset;

            try {
                const savedAssets = await saveCanvasAssets({
                    project_id: payload.project_id,
                    assets: [
                        {
                            asset_id: asset.id,
                            params: paramsWithReference,
                        },
                    ],
                });
                asset = savedAssets.find((item) => item.id === asset.id) ?? {
                    ...asset,
                    params: paramsWithReference,
                };
            } catch {
                asset = {
                    ...asset,
                    params: paramsWithReference,
                };
            }

            return {
                asset,
                sourceAsset: result.sourceAsset,
                sourceNodeId: payload.sourceNodeId,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : "创建引用节点失败",
            );
        }
    },
);

// 清除资产的直接引用来源（params.canvas.referenceSourceAssetId）
export const clearCanvasAssetReference = createAsyncThunk(
    "canvas/clearAssetReference",
    async (assetId: number, { rejectWithValue, getState }) => {
        try {
            const canvas = (getState() as { canvas: CanvasState }).canvas;
            const { projectId } = canvas;
            const assets = getCanvasAssetsList(canvas);
            const existingAsset = assets.find((item) => item.id === assetId);

            if (!projectId || !existingAsset) {
                throw new Error("资产不存在");
            }

            const paramsWithoutReference = buildAssetParamsWithoutReferenceSource(
                existingAsset.params,
            );
            const savedAssets = await saveCanvasAssets({
                project_id: projectId,
                assets: [
                    {
                        asset_id: assetId,
                        params: paramsWithoutReference,
                    },
                ],
            });
            const savedAsset = savedAssets.find((item) => item.id === assetId) ?? {
                ...existingAsset,
                params: paramsWithoutReference,
            };

            return { assetId, asset: savedAsset };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : "清除引用失败",
            );
        }
    },
);

// 创建资产并在画布追加节点
export const createCanvasAsset = createAsyncThunk(
    "canvas/createAsset",
    async (
        payload: {
            project_id: number;
            type: CanvasNodeKind;
            position?: { x: number; y: number };
        },
        { rejectWithValue },
    ) => {
        try {
            const asset = await createAsset({
                project_id: payload.project_id,
                type: payload.type,
            });

            return {
                asset,
                position: payload.position,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : "创建资产失败",
            );
        }
    },
);

// 批量删除画布暂存的资产（退出画布时调用）
export const deleteCanvasAssets = createAsyncThunk(
    "canvas/deleteAssets",
    async (assetIds: number[], { getState, rejectWithValue }) => {
        const { projectId } = (getState() as { canvas: CanvasState }).canvas;

        if (!projectId || assetIds.length === 0) {
            return [];
        }

        try {
            const deletedAssets = await batchDeleteAssets({
                project_id: projectId,
                asset_ids: assetIds,
            });
            return deletedAssets.map((item) => item.id);
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : "删除资产失败",
            );
        }
    },
);

// 保存画布布局到资产 params
export const saveCanvasLayout = createAsyncThunk(
    "canvas/saveLayout",
    async (_, { getState, rejectWithValue }) => {
        const { projectId, nodes, edges } = (getState() as { canvas: CanvasState }).canvas;
        const assets = getCanvasAssetsList((getState() as { canvas: CanvasState }).canvas);

        if (!projectId) {
            return rejectWithValue("项目 ID 无效");
        }

        try {
            const layout = serializeCanvasLayout(nodes, edges);
            const assetUpdates = serializeCanvasToAssetUpdates(nodes, edges, assets);

            if (assetUpdates.length > 0) {
                await saveCanvasAssets({
                    project_id: projectId,
                    assets: assetUpdates,
                });
            }

            return layout;
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : "保存画布失败",
            );
        }
    },
    {
        // 避免并发重复保存请求
        condition: (_, { getState }) => {
            return !(getState() as { canvas: CanvasState }).canvas.canvasSaving;
        },
    },
);

// 将画布资产归入素材库（type 设为 material）
export const markCanvasAssetAsMaterial = createAsyncThunk(
    "canvas/markAssetAsMaterial",
    async (assetId: number, { rejectWithValue }) => {
        try {
            const asset = await updateAssetType({
                asset_id: assetId,
                type: "material",
            });

            return {
                assetId,
                asset,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : (error as Error).message || "保存到素材库失败",
            );
        }
    },
);

// 更新角色/场景资料（名称与出现集数）
export const updateCharacterAssetProfile = createAsyncThunk(
    "canvas/updateCharacterAssetProfile",
    async (
        payload: {
            assetId: number;
            characterName?: string;
            appearanceName?: string;
            serieIds?: number[];
        },
        { rejectWithValue },
    ) => {
        try {
            const savedAssets = await updateAssetProfile({
                asset_id: payload.assetId,
                ...(payload.characterName !== undefined
                    ? { character_name: payload.characterName }
                    : {}),
                ...(payload.appearanceName !== undefined
                    ? { appearance_name: payload.appearanceName }
                    : {}),
                ...(payload.serieIds !== undefined ? { serie_ids: payload.serieIds } : {}),
            });

            return { savedAssets };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : (error as Error).message || "资料更新失败",
            );
        }
    },
);
