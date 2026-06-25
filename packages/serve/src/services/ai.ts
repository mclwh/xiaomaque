import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { env } from "../config/env.js";

/**
 * LangChain AI 服务：封装 OpenAI 对话能力
 */
export class AiService {
    private model: ChatOpenAI | null = null;

    private getModel(): ChatOpenAI {
        if (!env.OPENAI_API_KEY) {
            throw new Error("未配置 OPENAI_API_KEY");
        }

        if (!this.model) {
            this.model = new ChatOpenAI({
                openAIApiKey: env.OPENAI_API_KEY,
                modelName: "gpt-4o-mini",
                temperature: 0.7,
            });
        }

        return this.model;
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
