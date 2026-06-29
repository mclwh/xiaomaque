// 环境变量加载与校验
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { z } from "zod";

// packageRoot serve 包根目录（src/config 与 dist/config 均适用）
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// 启动前加载 .env 文件，兼容 PM2 直接 node dist/index.js 的场景
function loadEnvFile() {
    const isProduction = process.env.NODE_ENV === "production";
    // candidates 按优先级尝试的环境文件列表
    const candidates = isProduction
        ? [resolve(packageRoot, ".env.production"), resolve(packageRoot, ".env")]
        : [
              resolve(packageRoot, ".env.development"),
              resolve(packageRoot, ".env.production"),
              resolve(packageRoot, ".env"),
          ];

    for (const envPath of candidates) {
        if (!existsSync(envPath)) {
            continue;
        }

        config({ path: envPath });
        return;
    }
}

loadEnvFile();

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default("7d"),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_BASE_URL: z.string().url().optional(),
    ARK_API_KEY: z.string().optional(),
    ARK_BASE_URL: z
        .string()
        .url()
        .default("https://ark.cn-beijing.volces.com/api/v3"),
    SEEDREAM_MODEL_5_0: z.string().default("doubao-seedream-5-0-260128"),
    SEEDREAM_MODEL_4_5: z.string().default("doubao-seedream-4-5-251128"),
    SEEDANCE_MODEL_2_0: z.string().default("doubao-seedance-2-0-260128"),
    SEEDANCE_MODEL_2_0_FAST: z.string().default("doubao-seedance-2-0-fast-260128"),
    QINIU_ACCESS_KEY: z.string().optional(),
    QINIU_SECRET_KEY: z.string().optional(),
    QINIU_BUCKET: z.string().optional(),
    QINIU_UPLOAD_URL: z.string().url().default("https://up-z2.qiniup.com"),
    QINIU_IOVIP_URL: z.string().url().default("https://iovip-z2.qbox.me"),
    QINIU_CDN_BASE_URL: z.string().url(),
    QINIU_TOKEN_EXPIRES_IN: z.coerce.number().default(3600),
    QINIU_DOWNLOAD_EXPIRES_IN: z.coerce.number().default(3600),
    CORS_ORIGIN: z.string().default("http://localhost:12345"),
    API_SIGN_SECRET: z.string().min(1),
    API_SIGN_NONCE_TTL_MS: z.coerce.number().default(5 * 60 * 1000),
});

function parseEnv() {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const missingKeys = result.error.issues
            .map((issue) => issue.path.join("."))
            .join(", ");

        console.error(
            [
                "[env] 环境变量校验失败，请检查 packages/serve/.env.production（生产）或 .env.development（开发）",
                `[env] 问题字段：${missingKeys}`,
            ].join("\n"),
        );
        throw result.error;
    }

    return result.data;
}

export const env = parseEnv();
