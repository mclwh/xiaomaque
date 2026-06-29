import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { env } from "../config/env.js";
import { resolveOpenaiApiKey } from "../lib/openaiApiKey.js";
import { getRequestOpenaiApiKeyOverride } from "../lib/requestOpenaiApiKeyContext.js";

/**
 * LangChain AI 服务：封装 OpenAI 对话能力
 */
export class AiService {
    // 获取当前请求上下文下的 ChatOpenAI 实例
    private getModel(): ChatOpenAI {
        const apiKey = resolveOpenaiApiKey(getRequestOpenaiApiKeyOverride());

        return new ChatOpenAI({
            openAIApiKey: apiKey,
            modelName: "gpt-4o-mini",
            temperature: 0.7,
            configuration: env.OPENAI_BASE_URL
                ? { baseURL: env.OPENAI_BASE_URL }
                : undefined,
        });
    }

    async chat(message: string): Promise<string> {
        const model = this.getModel();
        const response = await model.invoke([new HumanMessage(message)]);
        return typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);
    }
}

// aiService AI 对话服务单例
export const aiService = new AiService();
