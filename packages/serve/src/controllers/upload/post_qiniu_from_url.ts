import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { qiniuFromUrlSchema, type QiniuFromUrlInput } from "../../validators/upload.js";
import { qiniuService } from "../../services/qiniu.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(qiniuFromUrlSchema)];

// 服务端触发七牛云从远程 URL 抓取图片（TOS → 七牛，不经浏览器 fetch）
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { url, category } = req.body as QiniuFromUrlInput;
    const result = await qiniuService.fetchFromRemoteUrl(url, category);

    return success(res, result, "图片转存成功");
});
