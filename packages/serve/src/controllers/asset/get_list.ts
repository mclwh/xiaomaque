import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { listAssetsSchema, type ListAssetsInput } from "../../validators/asset.js";
import { assetService } from "../../services/asset.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(listAssetsSchema, "query")];

// 查询项目资产列表
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { project_id: projectId, type } = req.query as unknown as ListAssetsInput;
    const assets = await assetService.listByProject(req.user!.userId, projectId, type);

    return success(res, assets, "获取资产列表成功");
});
