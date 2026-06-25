import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default("7d"),
    OPENAI_API_KEY: z.string().optional(),
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
        console.error(
            "[env] 环境变量校验失败，请确认已创建 packages/serve/.env.development（可参考 .env.development.example）",
        );
        throw result.error;
    }

    return result.data;
}

export const env = parseEnv();
