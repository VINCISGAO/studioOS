import "server-only";
import { hasOpenAI, openAIApiKey, resolveOpenAIModel } from "@/lib/core/config/ai";

export type OpenAIWiringStatus = {
  modelConfigured: boolean;
  model: string;
  keyLength: number;
};

export function getOpenAIWiringStatus(): OpenAIWiringStatus {
  const key = openAIApiKey();
  return {
    modelConfigured: hasOpenAI(),
    model: resolveOpenAIModel(),
    keyLength: key.length
  };
}

export function classifyOpenAIModelError(error: unknown): "invalid_key" | "request_failed" {
  const message = error instanceof Error ? error.message : String(error);
  return /401|403/.test(message) ? "invalid_key" : "request_failed";
}
