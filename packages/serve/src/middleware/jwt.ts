import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { unauthorized } from "../utils/response.js";

export interface JwtPayload {
    userId: number;
    phone: string;
}

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

// 判断请求路径是否命中 unless 规则
function isUnlessPath(routePath: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
        if (pattern.endsWith("*")) {
            const prefix = pattern.slice(0, -1);
            return routePath.startsWith(prefix);
        }

        return routePath === pattern;
    });
}

// 创建 JWT 认证中间件，unless 中的路由跳过 token 校验
export function createJwtMiddleware(unless: string[] = []) {
    return function jwtMiddleware(
        req: AuthRequest,
        res: Response,
        next: NextFunction,
    ) {
        if (isUnlessPath(req.path, unless)) {
            next();
            return;
        }

        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            unauthorized(res, "未提供认证令牌");
            return;
        }

        const token = authHeader.slice(7);

        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
            req.user = decoded;
            next();
        } catch {
            unauthorized(res, "认证令牌无效或已过期");
        }
    };
}

// 始终校验 token 的中间件（供单路由挂载使用）
export const jwtMiddleware = createJwtMiddleware();
