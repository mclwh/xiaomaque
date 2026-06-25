import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { createAssetSchema, type CreateAssetInput } from "../../validators/asset.js";
import { assetService } from "../../services/asset.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(createAssetSchema)];

// 新建项目资产
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId, type } = req.body as CreateAssetInput;
    const asset = await assetService.createAsset(req.user!.userId, projectId, type);

    return success(res, asset, "资产创建成功");
});
