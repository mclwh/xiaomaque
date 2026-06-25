import { z } from "zod";
import { STORAGE_CATEGORIES } from "../lib/storagePath.js";

// qiniuTokenSchema 七牛上传 token 请求校验
export const qiniuTokenSchema = z.object({
    category: z.enum(STORAGE_CATEGORIES, { message: "资源分类无效" }),
    ext: z
        .string()
        .trim()
        .regex(/^[a-z0-9]+$/i, "文件扩展名无效")
        .optional(),
});

// qiniuFromUrlSchema 远程图片转存七牛请求校验
export const qiniuFromUrlSchema = z.object({
    url: z.string().trim().url("图片地址无效"),
    category: z.enum(STORAGE_CATEGORIES, { message: "资源分类无效" }).default("image"),
});

/*
 * 各 schema 推导出的请求参数类型，供控制器复用
 */
export type QiniuTokenInput = z.infer<typeof qiniuTokenSchema>;
export type QiniuFromUrlInput = z.infer<typeof qiniuFromUrlSchema>;
