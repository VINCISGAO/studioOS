export type CanvasPromptEnhanceField = "music_style";

export const CANVAS_PROMPT_ENHANCE_MAX_LENGTH: Record<CanvasPromptEnhanceField, number> = {
  music_style: 500
};

const SYSTEM_PROMPTS: Record<CanvasPromptEnhanceField, string> = {
  music_style: `You optimize music-generation style prompts for AI music production (Mureka).
Improve clarity with genre, mood, tempo, energy, instrumentation, vocal character, and production texture.
Keep the creator's intent. Do not invent unrelated themes.
Return ONLY the optimized style prompt text — no quotes, labels, markdown, or explanation.`
};

export function canvasPromptEnhanceSystemPrompt(field: CanvasPromptEnhanceField) {
  return SYSTEM_PROMPTS[field];
}

export function normalizeEnhancedPrompt(text: string, maxLength: number) {
  const cleaned = text
    .replace(/^```[\s\S]*?\n/, "")
    .replace(/\n```$/, "")
    .replace(/^["'「『]|["'」』]$/g, "")
    .trim();
  return cleaned.slice(0, maxLength);
}
