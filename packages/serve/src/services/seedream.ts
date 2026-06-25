import { arkFetch, parseArkApiError } from "../lib/arkClient.js";
import {
    resolveSeedreamModelEndpoint,
    resolveSeedreamSize,
    type SeedreamAspectRatioId,
    type SeedreamModelId,
    type SeedreamResolution,
} from "../lib/seedreamModels.js";

// SeedreamGenerateImageInput 生图请求参数
export type SeedreamGenerateImageInput = {
    prompt: string;
    modelId: SeedreamModelId;
    aspectRatio: SeedreamAspectRatioId;
    resolution: SeedreamResolution;
    referenceImages?: string[];
};

// SeedreamGeneratedImage 单张生成结果（TOS 临时 URL，可用于 img 预览）
export type SeedreamGeneratedImage = {
    url: string;
};

// SeedreamGenerateImageResult 生图响应
export type SeedreamGenerateImageResult = {
    model: string;
    images: SeedreamGeneratedImage[];
    created: number;
};

// SeedreamApiResponse 火山方舟 images/generations 响应结构
type SeedreamApiResponse = {
    created?: number;
    data?: Array<{ url?: string; b64_json?: string }>;
    error?: {
        message?: string;
        code?: string;
    };
};

/**
 * Seedream 图片生成服务：封装火山方舟 Doubao Seedream API
 */
export class SeedreamImageService {
    // 调用火山方舟 images/generations 接口
    async generateImage(
        input: SeedreamGenerateImageInput,
        apiKeyOverride?: string,
    ): Promise<SeedreamGenerateImageResult> {
        const model = resolveSeedreamModelEndpoint(input.modelId);
        const size = resolveSeedreamSize(input.resolution, input.aspectRatio);
        const requestBody: Record<string, unknown> = {
            model,
            prompt: input.prompt,
            size,
            response_format: "url",
            watermark: false,
            sequential_image_generation: "disabled",
            stream: false,
        };

        if (input.referenceImages && input.referenceImages.length > 0) {
            requestBody.image =
                input.referenceImages.length === 1
                    ? input.referenceImages[0]
                    : input.referenceImages;
        }

        const response = await arkFetch(
            "/images/generations",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            },
            apiKeyOverride,
        );

        const payload = (await response.json().catch(() => null)) as
            | SeedreamApiResponse
            | null;

        if (!response.ok) {
            throw new Error(parseArkApiError(payload, response.status, "Seedream"));
        }

        const images =
            payload?.data
                ?.map((item) => item.url)
                .filter((url): url is string => Boolean(url))
                .map((url) => ({ url })) ?? [];

        if (images.length === 0) {
            throw new Error("Seedream 未返回可用图片");
        }

        return {
            model,
            images,
            created: payload?.created ?? Math.floor(Date.now() / 1000),
        };
    }
}

// seedreamImageService Seedream 图片生成服务单例
export const seedreamImageService = new SeedreamImageService();
