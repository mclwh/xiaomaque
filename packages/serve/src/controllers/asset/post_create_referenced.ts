import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import {
    createReferencedAssetSchema,
    type CreateReferencedAssetInput,
} from "../../validators/asset.js";
import { assetService } from "../../services/asset.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(createReferencedAssetSchema)];

// 引用源节点创建资产并绑定 derive_id
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const {
        project_id: projectId,
        type,
        source_asset_id: sourceAssetId,
    } = req.body as CreateReferencedAssetInput;
    const result = await assetService.createReferencedAsset(
        req.user!.userId,
        projectId,
        type,
        sourceAssetId,
    );

    return success(res, result, "引用节点创建成功");
});
