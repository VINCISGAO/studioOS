import { randomId } from "@/lib/core/random-id";
import { aiGatewayService } from "@/features/ai/ai-gateway.service";
import type { AiCommunicationResult, LocalizeTextInput } from "@/features/communication/communication.types";
import { communicationConfig, normalizeLanguageCode } from "@/lib/core/config/communication";

function detectLanguageHeuristic(text: string): { language: string; confidence: number } {
  if (/[\u4e00-\u9fff]/.test(text)) {
    return /[繁體|國|臺|湾|區]/.test(text) ? { language: "zh_tw", confidence: 0.75 } : { language: "zh_cn", confidence: 0.85 };
  }
  if (/[\u3040-\u30ff]/.test(text)) return { language: "ja", confidence: 0.8 };
  if (/[\uac00-\ud7af]/.test(text)) return { language: "ko", confidence: 0.8 };
  if (/[\u0e00-\u0e7f]/.test(text)) return { language: "th", confidence: 0.75 };
  if (/[\u1780-\u17ff]/.test(text)) return { language: "km", confidence: 0.75 };
  return { language: "en", confidence: 0.7 };
}

function softenTone(text: string) {
  return text
    .replace(/\bsucks\b/gi, "needs improvement")
    .replace(/\bcheap\b/gi, "lacks premium feel")
    .replace(/\bterrible\b/gi, "does not meet expectations")
    .replace(/\bawful\b/gi, "requires significant revision");
}

function templateLocalize(input: LocalizeTextInput): AiCommunicationResult {
  const detected = detectLanguageHeuristic(input.content);
  const target = normalizeLanguageCode(input.targetLanguage);
  const softened = softenTone(input.content);
  const needsSummary = input.content.length >= communicationConfig.summaryMinChars;

  const localizedContent =
    detected.language === target
      ? softened
      : `[${target}] ${softened}`;

  const todos: string[] = [];
  const lower = input.content.toLowerCase();
  if (lower.includes("logo")) todos.push("Adjust logo size or placement");
  if (lower.includes("cta") || lower.includes("call to action")) todos.push("Move or strengthen CTA");
  if (lower.includes("subtitle") || lower.includes("caption")) todos.push("Improve subtitle readability");
  if (lower.includes("ending") || lower.includes("end card")) todos.push("Revise ending / end card");
  if (lower.includes("intro")) todos.push("Shorten or tighten intro");
  if (!todos.length && input.content.length > 40) todos.push("Review client feedback and revise deliverable");

  return {
    language: detected.language,
    confidence: detected.confidence,
    localizedContent,
    summary: needsSummary
      ? `• Key feedback captured\n• ${todos.slice(0, 3).join("\n• ")}`
      : null,
    todos
  };
}

function buildSystemPrompt(input?: LocalizeTextInput) {
  const tone = input?.tone ? `\nPreferred tone: ${input.tone}` : "";
  const emoji = input?.neverUseEmojis ? "\nNever use emojis." : "";
  const memory = input?.memoryContext?.trim()
    ? `\n\nCampaign Memory (use for context — "same as last time" references):\n${input.memoryContext}`
    : "";

  return `You are VINCIS AI Communication Engine for global ad production collaboration.
Output ONLY valid JSON. No markdown. No code fences.

Goals:
- Auto-detect source language
- Translate and tone-optimize for cross-cultural brand↔creator collaboration
- Never use aggressive or insulting language in localizedContent
- Understand ad production context (CTA, logo, pacing, hooks, subtitles, end cards)
- Use Brand/Creator/Relationship DNA when message references prior work
- Do NOT translate word-by-word; preserve intent and professional tone
- Generate summary only when message is long (200+ chars)
- Extract actionable creator todos when feedback is present

Privacy: treat content as confidential client work.${tone}${emoji}${memory}`;
}

function buildUserPrompt(input: LocalizeTextInput) {
  return JSON.stringify({
    task: "localize_message",
    sourceType: input.sourceType,
    context: input.context ?? "ad production collaboration",
    senderRole: input.senderRole ?? "brand",
    targetLanguage: normalizeLanguageCode(input.targetLanguage),
    supportedLanguages: communicationConfig.supportedLanguages,
    content: input.content,
    memoryContext: input.memoryContext ?? null,
    outputSchema: {
      language: "detected source language code",
      confidence: "0-1",
      localizedContent: "tone-optimized translation in target language",
      summary: "bullet summary or null",
      todos: ["action item strings"]
    }
  });
}

function parseAiResult(raw: string, fallback: AiCommunicationResult): AiCommunicationResult {
  try {
    const parsed = JSON.parse(raw) as Partial<AiCommunicationResult>;
    if (!parsed.localizedContent?.trim()) return fallback;
    return {
      language: normalizeLanguageCode(parsed.language ?? fallback.language),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : fallback.confidence,
      localizedContent: parsed.localizedContent.trim(),
      summary: parsed.summary?.trim() || null,
      todos: Array.isArray(parsed.todos) ? parsed.todos.map(String).filter(Boolean) : fallback.todos
    };
  } catch {
    return fallback;
  }
}

export class CommunicationAiService {
  async processMessage(input: LocalizeTextInput): Promise<{
    result: AiCommunicationResult;
    model: string;
    provider: string;
    tokenInput: number;
    tokenOutput: number;
    cost: number;
    latencyMs: number;
    attempts: number;
    failed: boolean;
    error?: string;
  }> {
    const fallback = templateLocalize(input);
    if (!aiGatewayService.isConfigured()) {
      return {
        result: fallback,
        model: "template",
        provider: "template",
        tokenInput: 0,
        tokenOutput: 0,
        cost: 0,
        latencyMs: 0,
        attempts: 1,
        failed: false
      };
    }

    let lastError: string | undefined;
    for (let attempt = 1; attempt <= communicationConfig.maxRetries; attempt++) {
      try {
        const completion = await aiGatewayService.chatCompletion({
          system: buildSystemPrompt(input),
          user: buildUserPrompt(input),
          jsonMode: true,
          temperature: 0.3
        });
        const result = parseAiResult(completion.content, fallback);
        return {
          result,
          model: completion.model,
          provider: completion.provider,
          tokenInput: completion.tokenInput,
          tokenOutput: completion.tokenOutput,
          cost: completion.cost,
          latencyMs: completion.latencyMs,
          attempts: attempt,
          failed: false
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    return {
      result: fallback,
      model: "fallback",
      provider: "fallback",
      tokenInput: 0,
      tokenOutput: 0,
      cost: 0,
      latencyMs: 0,
      attempts: communicationConfig.maxRetries,
      failed: true,
      error: lastError
    };
  }

  async summarize(content: string, targetLanguage?: string) {
    const input: LocalizeTextInput = {
      content,
      targetLanguage: targetLanguage ?? "en",
      sourceType: "SYSTEM",
      context: "summarize long message"
    };
    const processed = await this.processMessage(input);
    return processed.result.summary;
  }

  async extractTodos(content: string, targetLanguage?: string) {
    const input: LocalizeTextInput = {
      content,
      targetLanguage: targetLanguage ?? "en",
      sourceType: "SYSTEM",
      context: "extract creator action items"
    };
    const processed = await this.processMessage(input);
    return processed.result.todos.map((text) => ({ id: randomId(), text, done: false }));
  }
}

export const communicationAiService = new CommunicationAiService();
