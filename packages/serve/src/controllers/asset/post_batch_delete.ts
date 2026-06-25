import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { batchDeleteAssetsSchema, type BatchDeleteAssetsInput } from "../../validators/asset.js";
import { assetService } from "../../services/asset.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(batchDeleteAssetsSchema)];

// 批量删除项目资产（单条删除同样走此接口）
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId, asset_ids: assetIds } = req.body as BatchDeleteAssetsInput;
    const deletedAssets = await assetService.deleteAssets(req.user!.userId, projectId, assetIds);

    return success(res, deletedAssets, "资产删除成功");
});
