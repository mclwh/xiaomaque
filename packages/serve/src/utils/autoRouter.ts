import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import express, {
    type RequestHandler,
    type Router,
} from "express";

/** 仅注册 GET 与 POST；非 GET 的写操作统一走 POST，不使用 PUT/DELETE */
const ALLOWED_METHODS: readonly HttpMethod[] = ["get", "post"];

type HttpMethod = "get" | "post";

interface Logger {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
}

export interface RouteModule {
    default?: RequestHandler;
    handler?: RequestHandler;
    middleware?: RequestHandler | RequestHandler[];
    middlewares?: RequestHandler[];
}

function resolveMiddlewares(module: RouteModule): RequestHandler[] {
    if (module.middlewares) return module.middlewares;
    if (module.middleware) {
        return Array.isArray(module.middleware)
            ? module.middleware
            : [module.middleware];
    }
    return [];
}

export interface AutoRouterOptions {
    controllersDir: string;
    basePath?: string;
    defaultMiddlewares?: RequestHandler[];
    logger?: Logger;
}

const CONTROLLER_FILE_RE = /\.(ts|js)$/i;

function isControllerFile(name: string): boolean {
    return (
        CONTROLLER_FILE_RE.test(name) &&
        !name.startsWith("_") &&
        !name.endsWith(".d.ts")
    );
}

/**
 * 根据文件名解析 HTTP 方法：post_ 为 POST，get_ 为 GET，其余默认为 GET
 */
function extractMethod(fileName: string): HttpMethod {
    const base = fileName.replace(CONTROLLER_FILE_RE, "");
    if (base.startsWith("post_")) return "post";
    if (base.startsWith("get_")) return "get";
    return "get";
}

/**
 * 去掉 get_ 或 post_ 前缀，得到 URL 路径名（如 post_create → create）
 */
function stripMethodPrefix(fileName: string): string {
    let name = fileName.replace(CONTROLLER_FILE_RE, "");
    if (name.startsWith("post_")) return name.slice(5);
    if (name.startsWith("get_")) return name.slice(4);
    return name;
}

function buildRoutePath(dirPath: string, fileName: string): string {
    const name = stripMethodPrefix(fileName);
    const dirSegments = dirPath ? dirPath.split(path.sep).filter(Boolean) : [];
    const routeSegments = [...dirSegments, name];
    return "/" + routeSegments.join("/");
}

/**
 * 自动扫描控制器目录并注册 Express 路由
 */
export async function autoRouter(options: AutoRouterOptions): Promise<Router> {
    const {
        controllersDir,
        basePath = "",
        defaultMiddlewares = [],
        logger = console,
    } = options;

    const router = express.Router();
    const absControllersDir = path.resolve(controllersDir);

    if (!fs.existsSync(absControllersDir)) {
        logger.warn(`Controllers directory not found: ${absControllersDir}`);
        return router;
    }

    async function registerRoute(
        filePath: string,
        dirPath: string,
        fileName: string,
    ): Promise<void> {
        try {
            const moduleUrl = pathToFileURL(filePath).href;
            const routeModule = (await import(moduleUrl)) as RouteModule;
            const handler = routeModule.default ?? routeModule;

            if (typeof handler !== "function" && !routeModule.handler) {
                logger.warn(`Invalid handler in file: ${filePath}`);
                return;
            }

            const routeHandler = routeModule.handler ?? (handler as RequestHandler);
            const routeMiddlewares = resolveMiddlewares(routeModule);
            const method = extractMethod(fileName);
            const routePath = buildRoutePath(dirPath, fileName);
            const allMiddlewares = [...defaultMiddlewares, ...routeMiddlewares];

            if (ALLOWED_METHODS.includes(method)) {
                router[method](routePath, ...allMiddlewares, routeHandler);
                logger.info(
                    `Registered route: ${method.toUpperCase()} ${basePath}${routePath}`,
                );
            } else {
                logger.warn(`Invalid HTTP method: ${method} in file: ${filePath}`);
            }
        } catch (error) {
            logger.error(`Error registering route from file: ${filePath}`, error);
        }
    }

    async function walkDir(dir: string, currentPath = ""): Promise<void> {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                const newPath = path.join(currentPath, item);
                await walkDir(itemPath, newPath);
            } else if (stat.isFile() && isControllerFile(item)) {
                await registerRoute(itemPath, currentPath, item);
            }
        }
    }

    await walkDir(absControllersDir);

    return router;
}
