import type { Locale } from "@/lib/i18n";
import { hasOpenAI, openAIModel } from "@/lib/studioos/config";

export type TranslateResult = {
  text: string;
  translated: boolean;
  source: "openai" | "same_locale" | "unchanged" | "empty";
};

const TARGET_LABEL: Record<Locale, string> = {
  en: "English",
  zh: "Simplified Chinese"
};

export async function translateForClient(
  text: string,
  sourceLocale: Locale,
  targetLocale: Locale
): Promise<TranslateResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { text: "", translated: false, source: "empty" };
  }

  if (sourceLocale === targetLocale) {
    return { text: trimmed, translated: false, source: "same_locale" };
  }

  if (!hasOpenAI()) {
    return { text: trimmed, translated: false, source: "unchanged" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: openAIModel(),
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You translate short production notes for a brand client reviewing a video ad deliverable. Preserve meaning, names, and timestamps. Return only the translation with no quotes or preamble."
          },
          {
            role: "user",
            content: `Translate the following studio version notes into ${TARGET_LABEL[targetLocale]}.\n\n${trimmed}`
          }
        ]
      }),
      signal: AbortSignal.timeout(20_000)
    });

    if (!response.ok) {
      return { text: trimmed, translated: false, source: "unchanged" };
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const translated = data.choices?.[0]?.message?.content?.trim();
    if (!translated) {
      return { text: trimmed, translated: false, source: "unchanged" };
    }

    return { text: translated, translated: true, source: "openai" };
  } catch {
    return { text: trimmed, translated: false, source: "unchanged" };
  }
}
