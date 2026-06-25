import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { readArkApiKeyFromRequest } from "../../lib/arkApiKey.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { generateImageSchema, type GenerateImageInput } from "../../validators/generation.js";
import { seedreamImageService } from "../../services/seedream.js";
import { buildGenerationPrompt } from "../../lib/generationPrompt.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(generateImageSchema)];

// 调用 Seedream 生成图片
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const {
        prompt,
        model_id: modelId,
        aspect_ratio: aspectRatio,
        resolution,
        reference_images: referenceImages,
        type,
        image_style_id: imageStyleId,
    } = req.body as GenerateImageInput;

    const arkApiKey = readArkApiKeyFromRequest(req);
    const result = await seedreamImageService.generateImage(
        {
            prompt: buildGenerationPrompt(prompt, type, imageStyleId),
            modelId,
            aspectRatio,
            resolution,
            referenceImages,
        },
        arkApiKey,
    );

    return success(res, result, "图片生成成功");
});
