import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { updateAssetProfileSchema, type UpdateAssetProfileInput } from "../../validators/asset.js";
import { assetService } from "../../services/asset.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(updateAssetProfileSchema)];

// 更新角色/场景资料（名称与出现集数，save 接口不处理这些字段）
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const {
        asset_id: assetId,
        character_name,
        appearance_name,
        serie_ids,
    } = req.body as UpdateAssetProfileInput;

    const assets = await assetService.updateAssetProfile(req.user!.userId, assetId, {
        characterName: character_name,
        appearanceName: appearance_name,
        serieIds: serie_ids,
    });

    return success(res, assets, "资料更新成功");
});
