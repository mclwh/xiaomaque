import { z } from "zod";
import { GENERATION_PROMPT_ASSET_TYPES } from "../lib/generationPrompt.js";
import { IMAGE_STYLE_IDS } from "../lib/imageStyles.js";
import {
    SEEDREAM_ASPECT_RATIO_IDS,
    SEEDREAM_MODEL_IDS,
    SEEDREAM_RESOLUTIONS,
} from "../lib/seedreamModels.js";

// generateImageSchema 图片生成请求校验
export const generateImageSchema = z.object({
    prompt: z.string().trim().min(1, "提示词不能为空").max(800, "提示词过长"),
    model_id: z.enum(SEEDREAM_MODEL_IDS, { message: "模型无效" }),
    aspect_ratio: z.enum(SEEDREAM_ASPECT_RATIO_IDS).default("auto"),
    resolution: z.enum(SEEDREAM_RESOLUTIONS).default("3K"),
    reference_images: z
        .array(z.string().trim().min(1, "参考图地址无效"))
        .max(10, "参考图最多 10 张")
        .optional(),
    type: z.enum(GENERATION_PROMPT_ASSET_TYPES).optional(),
    image_style_id: z.enum(IMAGE_STYLE_IDS).optional(),
});

// GenerateImageInput 图片生成请求参数类型
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
