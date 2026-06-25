import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { updateAssetMediaSchema, type UpdateAssetMediaInput } from "../../validators/asset.js";
import { assetService } from "../../services/asset.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(updateAssetMediaSchema)];

// 更新资产媒体 key（url / cover）
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { asset_id: assetId, url, cover } = req.body as UpdateAssetMediaInput;
    const asset = await assetService.updateAssetMedia(req.user!.userId, assetId, {
        url,
        cover,
    });

    return success(res, asset, "资产媒体更新成功");
});
