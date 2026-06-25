import type { Request, Response, NextFunction } from "express";

/**
 * 请求日志中间件：记录每次 HTTP 请求的方法、路径、状态码与耗时
 */
export function loggerMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        console.log(
            `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
        );
    });

    next();
}
