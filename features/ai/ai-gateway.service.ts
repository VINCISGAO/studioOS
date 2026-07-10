import { aiConfig, estimateTokenCost, hasOpenAI, openAIApiKey, resolveOpenAIModel } from "@/lib/core/config/ai";
import { logger } from "@/lib/core/logger";

export type ChatCompletionResult = {
  content: string;
  model: string;
  provider: string;
  tokenInput: number;
  tokenOutput: number;
  cost: number;
  latencyMs: number;
};

export class AiGatewayService {
  isConfigured() {
    return hasOpenAI();
  }

  defaultModel() {
    return aiConfig.defaultModel;
  }

  async chatCompletion(input: {
    system: string;
    user: string;
    model?: string;
    temperature?: number;
    jsonMode?: boolean;
    language?: string;
  }): Promise<ChatCompletionResult> {
    const model = resolveOpenAIModel(input.model);
    const started = Date.now();

    if (!hasOpenAI()) {
      return {
        content: "",
        model: "template",
        provider: "template",
        tokenInput: 0,
        tokenOutput: 0,
        cost: 0,
        latencyMs: Date.now() - started
      };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.4,
        ...(input.jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages: [
          {
            role: "system",
            content: input.language
              ? `${input.system}\n\nOutput language: ${input.language}. All user-facing text must be written in this language.`
              : input.system
          },
          { role: "user", content: input.user }
        ]
      }),
      signal: AbortSignal.timeout(60_000)
    });

    const latencyMs = Date.now() - started;

    if (!response.ok) {
      const text = await response.text();
      logger.error("OpenAI request failed", { service: "AiGatewayService", status: response.status, text });
      throw new Error(`OpenAI error ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    const tokenInput = data.usage?.prompt_tokens ?? 0;
    const tokenOutput = data.usage?.completion_tokens ?? 0;
    const cost = estimateTokenCost(model, tokenInput, tokenOutput);

    return {
      content,
      model,
      provider: "openai",
      tokenInput,
      tokenOutput,
      cost,
      latencyMs
    };
  }
}

export const aiGatewayService = new AiGatewayService();
