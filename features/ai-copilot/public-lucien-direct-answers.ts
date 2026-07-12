function isZh(language: string) {
  return language === "zh-CN" || language === "zh-TW" || language === "zh";
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export type PublicLucienDirectAnswer = {
  answer: string;
  answerMode: "direct";
};

export function resolvePublicLucienDirectAnswer(
  message: string,
  language: string
): PublicLucienDirectAnswer | null {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const zh = isZh(language);
  const normalized = trimmed.toLowerCase();

  if (
    matchesAny(trimmed, [
      /你叫什么名字|你是谁|你的名字|你叫什么|你叫啥|你哪位|介绍一下你自己/,
      /what(?:'s| is) your name|who are you\b|your name\b/i
    ]) ||
    matchesAny(normalized, [/who are you/, /your name/])
  ) {
    return {
      answer: zh
        ? "我是卢西恩（Lucien），VINCIS 的 AI 业务助手，专门解答平台使用、报价、项目流程和合作伙伴政策等问题。"
        : "I'm Lucien, VINCIS's AI business assistant. I help with platform usage, pricing, project workflows, and partner policies.",
      answerMode: "direct"
    };
  }

  if (
    matchesAny(trimmed, [/你能做什么|你会什么|你能帮我什么|你有什么功能|你能回答什么/]) ||
    matchesAny(normalized, [/what can you do/, /how can you help/])
  ) {
    return {
      answer: zh
        ? "我可以解答 VINCIS 常见问题，例如：如何发布项目、托管付款如何运作、报价与交付周期、合作伙伴佣金，以及品牌/创作者工作台的基础流程。登录后我还能结合你的账号数据给出更具体的建议。"
        : "I can answer common VINCIS questions—posting projects, escrow payments, pricing, delivery timelines, partner commissions, and basic brand/creator workspace flows. After sign-in I can also use your account context for more specific guidance.",
      answerMode: "direct"
    };
  }

  return null;
}

export function publicLucienModelUnavailableAnswer(language: string, suggestedExamples: string[]) {
  const zh = isZh(language);
  const examples = suggestedExamples.slice(0, 2).filter(Boolean);
  const exampleText = examples.length > 0 ? examples.join(zh ? "、" : ", ") : zh ? "怎么发布项目" : "How to post a project";

  return zh
    ? `这类问题需要语言模型辅助，但服务器未读取到 OPENAI_API_KEY。你可以先问我 FAQ 里的常见问题，例如：${exampleText}。`
    : `This needs the language model, but the server did not read OPENAI_API_KEY. Try an FAQ question first, such as: ${exampleText}.`;
}

export function publicLucienModelFailureAnswer(language: string, reason: "invalid_key" | "request_failed") {
  const zh = isZh(language);
  if (reason === "invalid_key") {
    return zh
      ? "密钥已配置，但 OpenAI 拒绝了请求。请检查：API Key 是否有效、是否复制完整、账户是否有余额。"
      : "A key is configured, but OpenAI rejected the request. Check that the API key is valid, complete, and the account has credits.";
  }
  return zh ? "语言模型调用失败，请稍后再试。" : "Language model request failed. Please try again shortly.";
}
