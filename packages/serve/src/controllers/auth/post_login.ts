import type { AuthRequest } from "../../middleware/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateMiddleware } from "../../middleware/validate.js";
import { loginSchema, type LoginInput } from "../../validators/auth.js";
import { authService } from "../../services/auth.js";
import { success } from "../../utils/response.js";

export const middleware = [validateMiddleware(loginSchema)];

// 手机号登录，不存在则自动注册
export const handler = asyncHandler<AuthRequest>(async (req, res) => {
    const { phone } = req.body as LoginInput;
    const result = await authService.loginWithPhone(phone);

    return success(res, result, "登录成功");
});
