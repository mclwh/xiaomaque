import { request } from "@/api/http";
import type { AssetCategoryType } from "@/lib/assetCategory";
import type { ImageStyleId } from "@/lib/imageStyles";
import type {
    GenerationAspectRatioId,
    GenerationResolution,
} from "@/lib/generationOptions";

// ImageGenerationModelId 生图模型 ID
export type ImageGenerationModelId = "seedream-5.0" | "seedream-4.5";

// GenerateImagePayload 图片生成请求体
export type GenerateImagePayload = {
    prompt: string;
    model_id: ImageGenerationModelId;
    aspect_ratio?: GenerationAspectRatioId;
    resolution?: GenerationResolution;
    reference_images?: string[];
    type?: AssetCategoryType;
    image_style_id?: ImageStyleId;
};

// GeneratedImageItem 单张生成结果（TOS 临时 URL）
export type GeneratedImageItem = {
    url: string;
};

// GenerateImageResult 图片生成响应
export type GenerateImageResult = {
    model: string;
    images: GeneratedImageItem[];
    created: number;
};

// 调用 Seedream 生成图片
export function generateImage(payload: GenerateImagePayload) {
    return request<GenerateImageResult>("/generation/image", {
        method: "POST",
        data: payload,
    });
}
