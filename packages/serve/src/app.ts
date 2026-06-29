import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { loggerMiddleware } from "./middleware/logger.js";
import { errorMiddleware } from "./middleware/error.js";
import { openaiApiKeyMiddleware } from "./middleware/openaiApiKey.js";
import { signatureMiddleware, type SignedRequest } from "./middleware/signature.js";
import routes from "./routes/index.js";

/**
 * Express 应用实例：注册全局中间件与路由
 */
export function createApp() {
    const app = express();

    // corsOrigins 允许跨域的前端地址列表
    const corsOrigins = env.CORS_ORIGIN.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    app.use(
        cors({
            origin: corsOrigins,
            credentials: true,
            allowedHeaders: [
                "Content-Type",
                "Authorization",
                "X-Timestamp",
                "X-Nonce",
                "X-Signature",
                "X-Ark-Api-Key",
                "X-Openai-Api-Key",
            ],
        }),
    );
    app.use(
        express.json({
            verify: (req, _res, buf) => {
                (req as SignedRequest).rawBody = buf.toString("utf8");
            },
        }),
    );
    app.use(loggerMiddleware);
    app.use("/api", openaiApiKeyMiddleware);
    app.use("/api", signatureMiddleware);
    app.use("/api", routes);

    app.use(errorMiddleware);

    return app;
}