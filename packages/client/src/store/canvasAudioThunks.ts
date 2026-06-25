// 画布音频 Thunk：音频提示词、参考文件保存与角色音色绑定/解绑
import { createAsyncThunk } from "@reduxjs/toolkit";
import { saveCanvasAssets } from "@/api/asset";
import { ApiError } from "@/api/types";
import type { CanvasAudioReferenceFile } from "@/types/assetParams";
import {
    buildAssetParamsWithAudioCharacterBinding,
    buildAssetParamsWithAudioGeneration,
    buildAssetParamsWithVoiceAudio,
    buildAssetParamsWithoutAudioCharacterBinding,
    buildAssetParamsWithoutVoiceAudio,
    readAssetAudioCharacterBinding,
    readAssetAudioGenerationSettings,
    readAssetVoiceAudio,
} from "@/lib/assetParams";
import { getCanvasAssetsList } from "@/lib/canvasStateHelpers";
import type { CanvasState } from "@/store/types/canvas";

// 保存音频节点提示词（后续可接入音频生成 API）
export const submitCanvasAudioPrompt = createAsyncThunk(
    "canvas/submitAudioPrompt",
    async (
        payload: {
            assetId: number;
            prompt: string;
        },
        { rejectWithValue, getState },
    ) => {
        try {
            const canvas = (getState() as { canvas: CanvasState }).canvas;
            const { projectId } = canvas;
            const assets = getCanvasAssetsList(canvas);
            const existingAsset = assets.find((item) => item.id === payload.assetId);

            if (!projectId) {
                throw new Error("项目 ID 无效");
            }

            const existingAudio = readAssetAudioGenerationSettings(existingAsset?.params);
            const paramsWithAudio = buildAssetParamsWithAudioGeneration(existingAsset?.params, {
                prompt: payload.prompt,
                ...(existingAudio?.referenceFiles?.length
                    ? { referenceFiles: existingAudio.referenceFiles }
                    : {}),
            });
            const savedAssets = await saveCanvasAssets({
                project_id: projectId,
                assets: [
                    {
                        asset_id: payload.assetId,
                        params: paramsWithAudio,
                    },
                ],
            });
            const savedAsset =
                savedAssets.find((item) => item.id === payload.assetId) ?? existingAsset;

            if (!savedAsset) {
                throw new Error("保存音频提示词失败");
            }

            return {
                assetId: payload.assetId,
                asset: savedAsset,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : (error as Error).message || "保存失败",
            );
        }
    },
);

// 保存音频节点参考文件列表
export const saveCanvasAudioReferenceFiles = createAsyncThunk(
    "canvas/saveAudioReferenceFiles",
    async (
        payload: {
            assetId: number;
            prompt: string;
            referenceFiles: CanvasAudioReferenceFile[];
        },
        { rejectWithValue, getState },
    ) => {
        try {
            const canvas = (getState() as { canvas: CanvasState }).canvas;
            const { projectId } = canvas;
            const assets = getCanvasAssetsList(canvas);
            const existingAsset = assets.find((item) => item.id === payload.assetId);

            if (!projectId) {
                throw new Error("项目 ID 无效");
            }

            const paramsWithAudio = buildAssetParamsWithAudioGeneration(existingAsset?.params, {
                prompt: payload.prompt,
                referenceFiles: payload.referenceFiles,
            });
            const savedAssets = await saveCanvasAssets({
                project_id: projectId,
                assets: [
                    {
                        asset_id: payload.assetId,
                        params: paramsWithAudio,
                    },
                ],
            });
            const savedAsset =
                savedAssets.find((item) => item.id === payload.assetId) ?? existingAsset;

            if (!savedAsset) {
                throw new Error("保存音频参考文件失败");
            }

            return {
                assetId: payload.assetId,
                asset: savedAsset,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : (error as Error).message || "保存失败",
            );
        }
    },
);

// 将音频绑定到角色（写入角色 voiceAudio 与音频节点 audioCharacterBinding）
export const bindAudioToCharacters = createAsyncThunk(
    "canvas/bindAudioToCharacters",
    async (
        payload: {
            audioAssetId: number;
            characterAssetIds: number[];
            bindMode: "single" | "derive_group";
            deriveId?: string | null;
        },
        { rejectWithValue, getState },
    ) => {
        try {
            const canvas = (getState() as { canvas: CanvasState }).canvas;
            const { projectId } = canvas;
            const assets = getCanvasAssetsList(canvas);
            const audioAsset = assets.find((item) => item.id === payload.audioAssetId);

            if (!projectId) {
                throw new Error("项目 ID 无效");
            }

            if (!audioAsset?.url) {
                throw new Error("音频尚未上传");
            }

            if (payload.characterAssetIds.length === 0) {
                throw new Error("请选择要绑定的角色");
            }

            const voiceAudio = {
                sourceAssetId: payload.audioAssetId,
                url: audioAsset.url,
            };

            const characterUpdates = payload.characterAssetIds.map((characterAssetId) => {
                const characterAsset = assets.find((item) => item.id === characterAssetId);

                return {
                    asset_id: characterAssetId,
                    params: buildAssetParamsWithVoiceAudio(characterAsset?.params, voiceAudio),
                };
            });

            const audioParams = buildAssetParamsWithAudioCharacterBinding(audioAsset.params, {
                mode: payload.bindMode,
                characterAssetIds: payload.characterAssetIds,
                deriveId: payload.deriveId ?? null,
            });

            const savedAssets = await saveCanvasAssets({
                project_id: projectId,
                assets: [
                    ...characterUpdates,
                    {
                        asset_id: payload.audioAssetId,
                        params: audioParams,
                    },
                ],
            });

            return { savedAssets };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : (error as Error).message || "绑定角色失败",
            );
        }
    },
);

// 解除角色与音频的绑定关系
export const unbindCharacterVoiceAudio = createAsyncThunk(
    "canvas/unbindCharacterVoiceAudio",
    async (characterAssetId: number, { rejectWithValue, getState }) => {
        try {
            const canvas = (getState() as { canvas: CanvasState }).canvas;
            const { projectId } = canvas;
            const assets = getCanvasAssetsList(canvas);
            const characterAsset = assets.find((item) => item.id === characterAssetId);
            const voiceAudio = readAssetVoiceAudio(characterAsset?.params);

            if (!projectId) {
                throw new Error("项目 ID 无效");
            }

            if (!voiceAudio) {
                throw new Error("当前未绑定音频");
            }

            const updates: Array<{ asset_id: number; params: ReturnType<typeof buildAssetParamsWithoutVoiceAudio> }> = [
                {
                    asset_id: characterAssetId,
                    params: buildAssetParamsWithoutVoiceAudio(characterAsset?.params),
                },
            ];

            const audioAsset = assets.find((item) => item.id === voiceAudio.sourceAssetId);

            if (audioAsset) {
                const binding = readAssetAudioCharacterBinding(audioAsset.params);

                if (binding?.characterAssetIds.includes(characterAssetId)) {
                    const nextCharacterAssetIds = binding.characterAssetIds.filter(
                        (id) => id !== characterAssetId,
                    );

                    updates.push({
                        asset_id: audioAsset.id,
                        params:
                            nextCharacterAssetIds.length === 0
                                ? buildAssetParamsWithoutAudioCharacterBinding(audioAsset.params)
                                : buildAssetParamsWithAudioCharacterBinding(audioAsset.params, {
                                      ...binding,
                                      characterAssetIds: nextCharacterAssetIds,
                                  }),
                    });
                }
            }

            const savedAssets = await saveCanvasAssets({
                project_id: projectId,
                assets: updates,
            });

            return { savedAssets };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : (error as Error).message || "解除绑定失败",
            );
        }
    },
);
