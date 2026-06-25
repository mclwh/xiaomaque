import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authService } from "../../services/auth.js";
import { success } from "../../utils/response.js";

// 获取当前登录用户信息
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const profile = await authService.getProfile(req.user!.userId);

    return success(res, profile, "获取用户信息成功");
});
