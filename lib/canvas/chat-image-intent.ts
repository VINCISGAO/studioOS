export function wantsCanvasChatImageGeneration(message: string) {
  const text = message.trim();
  if (!text) return false;

  const lower = text.toLowerCase();
  const promptOnly =
    /(只要|仅需|只需要|only need|just need).{0,16}(prompt|提示词)/i.test(text) ||
    (/((给出|提供|写).{0,8}(prompt|提示词))/i.test(text) &&
      !/(生成一?[张幅个]|直接生成|帮我生成)/i.test(text));

  if (promptOnly) return false;

  const zhPatterns = [
    /生成.{0,16}(一?[张幅个]|几[张幅个])?.{0,24}(图|图片|照片|插画|海报|封面|壁纸)/,
    /(画|绘制|作).{0,10}(一?[张幅个])?.{0,20}(图|图片|照片|插画)/,
    /帮我.{0,16}生成.{0,24}(图|图片|照片|插画)/
  ];
  const enPatterns = [
    /\b(generate|create|make|draw)\b.{0,28}\b(an? |the )?(image|picture|photo|illustration|poster|wallpaper)\b/
  ];

  return [...zhPatterns, ...enPatterns].some((pattern) => pattern.test(text) || pattern.test(lower));
}

export function canvasChatImageCopy(locale: string) {
  const zh = locale === "zh-CN" || locale === "zh-TW" || locale === "zh";
  return {
    success: zh
      ? "已根据你的描述生成图片，你可以继续编辑或添加到画布。"
      : "I've generated the image from your description. You can keep editing or add it to the canvas.",
    successFromReference: zh
      ? "已根据参考图和你的描述完成图生图，你可以继续编辑或添加到画布。"
      : "I've generated a new image from your reference and prompt. You can keep editing or add it to the canvas.",
    failed: zh ? "图片生成失败，请稍后再试。" : "Image generation failed. Please try again later.",
    unconfigured: zh
      ? "当前未配置 OpenAI，无法生成图片。请配置 OPENAI_API_KEY 后重试。"
      : "OpenAI is not configured. Set OPENAI_API_KEY and try again.",
    quota: zh
      ? "已达到今日智能助手使用建议上限，请明天再试或联系平台支持。"
      : "You have reached today's recommended AI assistant limit. Try again tomorrow or contact support."
  };
}
