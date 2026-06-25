// 画布媒体 Thunk：图片生成、音频/图片上传与资产库媒体应用
import { createAsyncThunk } from "@reduxjs/toolkit";
import { saveCanvasAssets, updateAssetMedia } from "@/api/asset";
import { generateImage, type ImageGenerationModelId } from "@/api/generation";
import { fetchQiniuUploadToken, fetchRemoteImageToQiniu } from "@/api/upload";
import { ApiError } from "@/api/types";
import type { AssetCategoryType } from "@/lib/assetCategory";
import type { ImageStyleId } from "@/lib/imageStyles";
import type {
    GenerationAspectRatioId,
    GenerationResolution,
} from "@/lib/generationOptions";
import { buildAssetParamsWithGeneration } from "@/lib/assetParams";
import { inferAudioExtFromFile } from "@/lib/audioUpload";
import { inferImageExtFromFilename, isValidImageFile } from "@/lib/imageUpload";
import { collectReferenceSourceImageUrls } from "@/lib/canvasGroup";
import { uploadFileToQiniu } from "@/lib/qiniuUpload";
import { getCanvasAssetsList } from "@/lib/canvasStateHelpers";
import type { CanvasState } from "@/store/types/canvas";

// 生成图片并上传七牛云，回写资产 url
export const generateCanvasImage = createAsyncThunk(
    "canvas/generateImage",
    async (
        payload: {
            assetId: number;
            prompt: string;
            modelId: ImageGenerationModelId;
            aspectRatio: GenerationAspectRatioId;
            resolution: GenerationResolution;
            imageStyleId?: ImageStyleId;
        },
        { rejectWithValue, getState },
    ) => {
        try {
            const canvas = (getState() as { canvas: CanvasState }).canvas;
            const { projectId } = canvas;
            const assets = getCanvasAssetsList(canvas);
            const existingAsset = assets.find((item) => item.id === payload.assetId);
            const referenceImages = collectReferenceSourceImageUrls(assets, existingAsset);
            const generationResult = await generateImage({
                prompt: payload.prompt,
                model_id: payload.modelId,
                aspect_ratio: payload.aspectRatio,
                resolution: payload.resolution,
                ...(existingAsset?.type
                    ? { type: existingAsset.type as AssetCategoryType }
                    : {}),
                ...(payload.imageStyleId ? { image_style_id: payload.imageStyleId } : {}),
                ...(referenceImages.length > 0 ? { reference_images: referenceImages } : {}),
            });
            const generatedUrl = generationResult.images[0]?.url;

            if (!generatedUrl) {
                throw new Error("Seedream 未返回可用图片");
            }

            const storedImage = await fetchRemoteImageToQiniu({
                url: generatedUrl,
                category: "image",
            });

            const mediaAsset = await updateAssetMedia({
                asset_id: payload.assetId,
                url: storedImage.key,
                cover: storedImage.key,
            });

            if (!projectId) {
                throw new Error("项目 ID 无效");
            }

            const paramsWithGeneration = buildAssetParamsWithGeneration(existingAsset?.params, {
                prompt: payload.prompt,
                modelId: payload.modelId,
                aspectRatio: payload.aspectRatio,
                resolution: payload.resolution,
                ...(payload.imageStyleId ? { imageStyleId: payload.imageStyleId } : {}),
                sourceUrl: generatedUrl,
            });
            const savedAssets = await saveCanvasAssets({
                project_id: projectId,
                assets: [
                    {
                        asset_id: payload.assetId,
                        params: paramsWithGeneration,
                    },
                ],
            });
            const savedAsset =
                savedAssets.find((item) => item.id === payload.assetId) ?? mediaAsset;

            return {
                assetId: payload.assetId,
                asset: {
                    ...savedAsset,
                    url: mediaAsset.url,
                    cover: mediaAsset.cover,
                },
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : (error as Error).message || "图片生成失败",
            );
        }
    },
);

// 上传音频并绑定到资产 url
export const uploadCanvasAudioMedia = createAsyncThunk(
    "canvas/uploadAudioMedia",
    async (
        payload: {
            assetId: number;
            file: Blob;
            filename: string;
        },
        { rejectWithValue },
    ) => {
        try {
            const ext = inferAudioExtFromFile(payload.file, payload.filename);
            const tokenResult = await fetchQiniuUploadToken({ category: "audio", ext });

            await uploadFileToQiniu({
                uploadUrl: tokenResult.uploadUrl,
                token: tokenResult.token,
                objectKey: tokenResult.objectKey,
                file: payload.file,
            });

            const mediaAsset = await updateAssetMedia({
                asset_id: payload.assetId,
                url: tokenResult.objectKey,
            });

            return {
                assetId: payload.assetId,
                asset: mediaAsset,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : (error as Error).message || "音频上传失败",
            );
        }
    },
);

// 上传图片并绑定到资产 url / cover
export const uploadCanvasImageMedia = createAsyncThunk(
    "canvas/uploadImageMedia",
    async (
        payload: {
            assetId: number;
            file: File;
        },
        { rejectWithValue },
    ) => {
        try {
            if (!isValidImageFile(payload.file)) {
                throw new Error("请选择 20MB 以内的图片文件");
            }

            const ext = inferImageExtFromFilename(payload.file.name);
            const tokenResult = await fetchQiniuUploadToken({ category: "image", ext });

            await uploadFileToQiniu({
                uploadUrl: tokenResult.uploadUrl,
                token: tokenResult.token,
                objectKey: tokenResult.objectKey,
                file: payload.file,
            });

            const mediaAsset = await updateAssetMedia({
                asset_id: payload.assetId,
                url: tokenResult.objectKey,
                cover: tokenResult.objectKey,
            });

            return {
                assetId: payload.assetId,
                asset: mediaAsset,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : (error as Error).message || "图片上传失败",
            );
        }
    },
);

// 从资产库选择媒体并应用到当前节点
export const applyCanvasLibraryMedia = createAsyncThunk(
    "canvas/applyLibraryMedia",
    async (
        payload: {
            targetAssetId: number;
            sourceAssetId: number;
        },
        { rejectWithValue, getState },
    ) => {
        try {
            const canvas = (getState() as { canvas: CanvasState }).canvas;
            const assets = getCanvasAssetsList(canvas);
            const sourceAsset = assets.find((item) => item.id === payload.sourceAssetId);

            if (!sourceAsset?.url) {
                throw new Error("所选资产没有可用图片");
            }

            const mediaAsset = await updateAssetMedia({
                asset_id: payload.targetAssetId,
                url: sourceAsset.url,
                cover: sourceAsset.cover ?? sourceAsset.url,
            });

            return {
                assetId: payload.targetAssetId,
                asset: mediaAsset,
            };
        } catch (error) {
            return rejectWithValue(
                error instanceof ApiError ? error.message : (error as Error).message || "应用资产失败",
            );
        }
    },
);
