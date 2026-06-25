import { z } from "zod";

export const chatSchema = z.object({
    message: z.string().min(1, "消息不能为空"),
});

// ChatInput 对话请求参数类型
export type ChatInput = z.infer<typeof chatSchema>;
