import type { CreativeDirection } from "@/features/ai/creative-direction.types";
import type { Locale } from "@/lib/i18n";

function normalizeProductName(raw: string | undefined) {
  const value = raw?.trim();
  if (!value || /^campaign$/i.test(value) || /^product$/i.test(value)) return "产品";
  return value.replace(/\s+Campaign$/i, "") || "产品";
}

function productFromDirection(direction: CreativeDirection) {
  const candidates = [
    /Make\s+(.+?)\s+feel premium/i.exec(direction.coreIdea)?.[1],
    /showing\s+(.+?)\s+on camera/i.exec(direction.coreIdea)?.[1],
    /connect the twist to\s+(.+?)\./i.exec(direction.coreIdea)?.[1],
    /for\s+"?(.+?)"?\s*(?:\.|$)/i.exec(direction.hook)?.[1]
  ];
  return normalizeProductName(candidates.find(Boolean));
}

const zhTemplateCopy = {
  cinematic: (product: string): Omit<CreativeDirection, "id" | "recommendedBudget"> => ({
    title: "电影质感证明",
    coreIdea: `用高级质感的证明镜头呈现${product}的核心价值，让品牌一上来就显得更专业、更可信。`,
    hook: `开场 2 秒内用一个主视觉镜头展示${product}的动态质感。`,
    story: `从用户痛点切入，展示转折、揭示卖点、证明效果，最后落到品牌记忆点。`,
    visualStyle: "高级布光、浅景深、慢速推进、精致产品特写",
    tone: "自信、高级、有品牌感",
    shotList: [
      "动态产品特写开场",
      "生活方式场景展示核心使用方式",
      "证明镜头突出产品利益点",
      "干净的品牌收尾画面与行动引导"
    ],
    cta: "立即了解新品",
    recommendedCreatorType: "擅长灯光、产品特写和电影感画面的商业产品创作者",
    expectedOutcome: "在用户点击前提升产品价值感与品牌信任感。",
    rationale: "适合需要快速建立高级感和可信度的投放场景。"
  }),
  testimonial: (product: string): Omit<CreativeDirection, "id" | "recommendedBudget"> => ({
    title: "真实口碑证言",
    coreIdea: `让真实创作者在镜头前体验${product}，把用户的怀疑转化为信任。`,
    hook: `“我没想到${product}会有这个效果”作为真人开场。`,
    story: `创作者先提出疑问，再真实试用${product}，展示结果并解释为什么愿意推荐。`,
    visualStyle: "手持拍摄、自然光、快速剪辑、真实体验感",
    tone: "真实、亲近、有说服力",
    shotList: [
      "真人面对镜头提出好奇点",
      "开箱或首次接触产品",
      "使用前后或痛点解决演示",
      "创作者给出结论并引导行动"
    ],
    cta: "现在试试看",
    recommendedCreatorType: "镜头表达自然、擅长真实产品体验的口播型创作者",
    expectedOutcome: "用真实体验降低用户顾虑，提高考虑与转化意愿。",
    rationale: "适合依赖口碑、信任和真实使用场景驱动转化的产品。"
  }),
  interrupt: (product: string): Omit<CreativeDirection, "id" | "recommendedBudget"> => ({
    title: "破圈吸睛开场",
    coreIdea: `用反差感开场打断滑动，再快速把注意力连接到${product}的核心卖点。`,
    hook: "用意外视觉反差或趣味转场开场，再揭示产品利益点。",
    story: `先用强反差画面抓住注意力，再揭示${product}是解决方案，随后快速叠加利益证明。`,
    visualStyle: "醒目字幕、节奏剪辑、高饱和色彩、强对比画面",
    tone: "有趣、高能、节奏快",
    shotList: [
      "意外反差开场画面",
      "快速产品揭示并配合文字强化",
      "连续三个利益点快节奏展示",
      "高对比行动引导收尾"
    ],
    cta: "立即领取优惠",
    recommendedCreatorType: "懂短视频钩子、节奏剪辑和强字幕表达的效果型创作者",
    expectedOutcome: "提升停留率和开头观看时长，适合快节奏信息流。",
    rationale: "适合用户快速滑动、需要首帧强吸引力的投放环境。"
  })
};

function templateKey(title: string) {
  const normalized = title.trim().toLowerCase();
  if (normalized.includes("cinematic proof")) return "cinematic";
  if (normalized.includes("ugc testimonial")) return "testimonial";
  if (normalized.includes("pattern interrupt")) return "interrupt";
  return null;
}

export function localizeCreativeDirection(direction: CreativeDirection, locale: Locale): CreativeDirection {
  if (locale !== "zh") return direction;
  const key = templateKey(direction.title);
  if (!key) return direction;

  const product = productFromDirection(direction);
  const zh = zhTemplateCopy[key](product);
  return {
    ...direction,
    ...zh,
    recommendedBudget: direction.recommendedBudget
  };
}
