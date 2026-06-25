import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { badRequest } from "../utils/response.js";

type RequestPart = "body" | "query" | "params";

/**
 * Zod 校验中间件：对请求的 body / query / params 进行 schema 校验
 */
export function validateMiddleware(
    schema: ZodSchema,
    part: RequestPart = "body",
) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[part]);

        if (!result.success) {
            badRequest(res, "请求参数校验失败", result.error.flatten().fieldErrors);
            return;
        }

        req[part] = result.data;
        next();
    };
}
