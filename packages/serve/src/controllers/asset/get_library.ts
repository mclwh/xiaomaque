import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { listLibraryAssetsSchema, type ListLibraryAssetsInput } from "../../validators/asset.js";
import { assetService } from "../../services/asset.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(listLibraryAssetsSchema, "query")];

// 查询当前用户资产库列表（跨项目，按分类筛选并分页）
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const {
        type,
        page,
        page_size: pageSize,
        sort,
        keyword,
        filter,
    } = req.query as unknown as ListLibraryAssetsInput;
    const result = await assetService.listLibraryByUser(req.user!.userId, type, {
        page,
        pageSize,
        sort,
        keyword,
        filter,
    });

    return success(res, result, "获取资产库列表成功");
});
