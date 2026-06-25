import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { qiniuTokenSchema, type QiniuTokenInput } from "../../validators/upload.js";
import { qiniuService } from "../../services/qiniu.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(qiniuTokenSchema)];

// 获取七牛云上传 token 与存储 key
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { category, ext } = req.body as QiniuTokenInput;
    const result = qiniuService.createUploadToken(category, ext ?? "png");

    return success(res, result, "上传凭证获取成功");
});
