/** Platform policy: AI enhance / prompt writing always uses GPT via aiGatewayService — never Lucien persona generation. */
export type CanvasPromptEnhanceField = "music_style" | "video_prompt" | "image_prompt";

export const VIDEO_PROMPT_ENHANCE_MAX = 5000;
export const IMAGE_PROMPT_ENHANCE_MAX = 5000;

export const CANVAS_PROMPT_ENHANCE_MAX_LENGTH: Record<CanvasPromptEnhanceField, number> = {
  music_style: 500,
  video_prompt: VIDEO_PROMPT_ENHANCE_MAX,
  image_prompt: IMAGE_PROMPT_ENHANCE_MAX
};

const SYSTEM_PROMPTS: Record<CanvasPromptEnhanceField, string> = {
  music_style: `You optimize music-generation style prompts for AI music production (Mureka).
Improve clarity with genre, mood, tempo, energy, instrumentation, vocal character, and production texture.
Keep the creator's intent. Do not invent unrelated themes.
Return ONLY the optimized style prompt text — no quotes, labels, markdown, or explanation.`,
  video_prompt: `You are a senior creative director helping creators write prompts for AI video generation (Seedance).
Expand the creator's idea into a vivid, production-ready video prompt with subject, scene, action, mood, lighting, camera movement, and pacing.
Keep the creator's intent and reference context. Do not add unrelated brands, celebrities, or policy-violating content.
Return ONLY the enhanced video prompt text — no quotes, labels, markdown, or explanation.`,
  image_prompt: `You are a senior visual director helping creators write prompts for AI image generation.
Expand the creator's idea into a vivid, production-ready image prompt with subject, scene, composition, lighting, color palette, style, and fine detail.
Keep the creator's intent and reference context. Do not add unrelated brands, celebrities, or policy-violating content.
Return ONLY the enhanced image prompt text — no quotes, labels, markdown, or explanation.`
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
