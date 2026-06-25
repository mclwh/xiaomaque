import { z } from "zod";

// 中国大陆手机号
const phoneSchema = z
    .string()
    .regex(/^1[3-9]\d{9}$/, "手机号格式不正确");

export const loginSchema = z.object({
    phone: phoneSchema,
});

// LoginInput 登录请求参数类型
export type LoginInput = z.infer<typeof loginSchema>;
