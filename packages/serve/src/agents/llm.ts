import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env.js";

/**
 * Agent 共用 LLM 工厂：统一模型与 OpenAI 兼容接口配置
 */

// DEFAULT_LLM_MODEL 默认对话模型
export const DEFAULT_LLM_MODEL = "kimi-k2.6";

/**
 * 创建 LangChain ChatOpenAI 实例
 * @param temperature 采样温度
 */
export function createChatModel(temperature = 0.2): ChatOpenAI {
    if (!env.OPENAI_API_KEY) {
        throw new Error("未配置 OPENAI_API_KEY");
    }

    return new ChatOpenAI({
        openAIApiKey: env.OPENAI_API_KEY,
        modelName: DEFAULT_LLM_MODEL,
        temperature,
        configuration: env.OPENAI_BASE_URL
            ? { baseURL: env.OPENAI_BASE_URL }
            : undefined,
    });
}
