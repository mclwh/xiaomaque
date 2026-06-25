import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * 异步控制器包装器：自动捕获 handler 抛出的异常并交给全局错误中间件
 * 控制器因此无需逐个编写 try/catch
 * @param fn 业务处理函数（可返回 Promise）
 */
export function asyncHandler<Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => unknown | Promise<unknown>,
): RequestHandler {
    return (req, res, next) => {
        Promise.resolve(fn(req as Req, res, next)).catch(next);
    };
}
