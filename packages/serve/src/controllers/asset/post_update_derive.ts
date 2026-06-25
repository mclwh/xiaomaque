import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { updateAssetDeriveSchema, type UpdateAssetDeriveInput } from "../../validators/asset.js";
import { assetService } from "../../services/asset.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(updateAssetDeriveSchema)];

// 更新资产 derive_id
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { asset_id: assetId, derive_id: deriveId } = req.body as UpdateAssetDeriveInput;
    const asset = await assetService.updateAssetDerive(req.user!.userId, assetId, deriveId);

    return success(res, asset, "衍生关系更新成功");
});
