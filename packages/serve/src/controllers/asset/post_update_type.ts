import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { updateAssetTypeSchema, type UpdateAssetTypeInput } from "../../validators/asset.js";
import { assetService } from "../../services/asset.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(updateAssetTypeSchema)];

// 更新资产分类 type
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { asset_id: assetId, type } = req.body as UpdateAssetTypeInput;
    const asset = await assetService.updateAssetType(req.user!.userId, assetId, type);

    return success(res, asset, "资产分类更新成功");
});
