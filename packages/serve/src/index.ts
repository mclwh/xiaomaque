import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { migrateLegacySerieFragmentsFromJson } from "./lib/migrateLegacySerieFragments.js";

const app = createApp();

await migrateLegacySerieFragmentsFromJson();

const server = app.listen(env.PORT, () => {
    console.log(`[Server] 服务已启动 http://localhost:${env.PORT}`);
});

/**
 * 优雅关闭：nodemon 重启时释放端口，避免 EADDRINUSE
 */
function gracefulShutdown(signal: string) {
    console.log(`[Server] 收到 ${signal}，正在关闭...`);
    server.close(() => {
        process.exit(0);
    });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
