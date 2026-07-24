import type { CanvasPromptEnhanceField } from "@/lib/canvas/prompt-enhance";

export function wantsCanvasChatPromptEnhancement(message: string) {
  const text = message.trim();
  if (!text) return false;

  const patterns = [
    /(优化|增强|改进|润色|扩写|完善).{0,16}(prompt|提示词)/i,
    /((写|给出|提供|生成|帮我写).{0,12}(prompt|提示词))/i,
    /(视频|图片|图像|音乐).{0,12}(prompt|提示词)/i,
    /\b(enhance|improve|optimize|rewrite|write).{0,24}\b(prompt|提示)\b/i,
    /\b(video|image|music).{0,16}\bprompt\b/i,
    /AI\s*(增强|灵感|优化)/i
  ];

  return patterns.some((pattern) => pattern.test(text));
}

export function resolveCanvasChatPromptField(message: string): CanvasPromptEnhanceField {
  if (/音乐|music/i.test(message) && /(prompt|提示|风格|style)/i.test(message)) {
    return "music_style";
  }
  if (/图片|图像|image|photo|插画|illustration/i.test(message)) {
    return "image_prompt";
  }
  return "video_prompt";
}

export function extractPromptSourceFromChatMessage(message: string) {
  const text = message.trim();
  const colonMatch = text.match(/[:：]\s*([\s\S]+)$/);
  if (colonMatch?.[1]?.trim()) return colonMatch[1].trim();

  const quoteMatch = text.match(/[「『"']([^」』"']+)[」』"']/);
  if (quoteMatch?.[1]?.trim()) return quoteMatch[1].trim();

  const stripped = text
    .replace(
      /^(请|帮我|麻烦|能否)?(优化|增强|改进|润色|扩写|写|给出|提供|生成).{0,30}(prompt|提示词)[：:，,\s]*/i,
      ""
    )
    .trim();
  if (stripped && stripped !== text) return stripped;

  return "";
}
