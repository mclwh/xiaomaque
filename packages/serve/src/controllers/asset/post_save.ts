import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { saveAssetsSchema, type SaveAssetsInput } from "../../validators/asset.js";
import { assetService } from "../../services/asset.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(saveAssetsSchema)];

// 批量保存资产 params（画布布局由前端解析后写入，资料字段由 update_profile 维护）
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId, assets } = req.body as SaveAssetsInput;
    const savedAssets = await assetService.saveAssets(req.user!.userId, projectId, assets);

    return success(res, savedAssets, "画布保存成功");
});
