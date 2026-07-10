import { randomUUID } from "crypto";
import type { Locale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import { getConfirmedBriefText } from "@/lib/studioos/confirmed-brief";
import type { CollaborationIdea } from "@/features/creative-collaboration/creative-collaboration.types";

function productName(project: StoredProject): string {
  return (
    project.product_name?.trim() ||
    project.title?.trim() ||
    project.company_name?.trim() ||
    "Product"
  );
}

export function buildCollaborationTemplateIdeas(input: {
  project: StoredProject;
  locale: Locale;
  actor: CollaborationIdea["actor"];
  parentIdea?: CollaborationIdea;
  count?: number;
}): CollaborationIdea[] {
  const product = productName(input.project);
  const platform = input.project.target_platform || "TikTok";
  const brief = getConfirmedBriefText(input.project, input.locale);
  const parent = input.parentIdea;
  const count = input.count ?? 3;
  const now = new Date().toISOString();

  const zhTemplates = parent
    ? [
        {
          title: `深化：${parent.title}`,
          coreIdea: `在「${parent.coreIdea}」基础上，突出${product}的核心卖点与品牌记忆点。`,
          hook: parent.hook,
          story: `${parent.story} 本版本进一步细化镜头节奏与信息层次。`,
          visualStyle: parent.visualStyle,
          tone: parent.tone,
          shotList: parent.shotList,
          cta: parent.cta,
          rationale: `围绕品牌已选方向做二创衍生，不偏离「${parent.title}」。`
        },
        {
          title: `${parent.title} · 快节奏版`,
          coreIdea: `保持「${parent.coreIdea}」主线，用更快剪辑提升信息流停留。`,
          hook: `3 秒内完成钩子 + 产品揭示。`,
          story: `压缩铺垫，连续展示 3 个利益点，最后落到品牌 CTA。`,
          visualStyle: "快切、醒目字幕、高对比画面",
          tone: "高能、直接",
          shotList: ["强钩子开场", "产品特写三连", "用户场景快切", "品牌收尾"],
          cta: parent.cta,
          rationale: `适合${platform}快节奏投放，仍锚定品牌方向。`
        },
        {
          title: `${parent.title} · 质感升级版`,
          coreIdea: `延续「${parent.coreIdea}」，提升画面质感与信任感。`,
          hook: `电影感产品特写开场，建立高级第一印象。`,
          story: `从质感镜头切入，逐步展开卖点证明，再以品牌调性收尾。`,
          visualStyle: "浅景深、慢推、精致布光",
          tone: "高级、可信",
          shotList: ["质感特写", "生活方式场景", "证明镜头", "品牌落版"],
          cta: parent.cta,
          rationale: `在既定方向内强化品牌高级感。`
        }
      ]
    : [
        {
          title: "电影质感证明",
          coreIdea: `用高级质感镜头呈现${product}的核心价值，快速建立品牌信任。`,
          hook: `开场 2 秒内用主视觉展示${product}。`,
          story: brief
            ? `结合需求说明：${brief.slice(0, 120)}…`
            : `从痛点切入，展示转折、揭示卖点、证明效果，最后落到品牌记忆点。`,
          visualStyle: "高级布光、浅景深、慢速推进",
          tone: "自信、高级",
          shotList: ["动态产品特写", "生活方式场景", "证明镜头", "品牌收尾"],
          cta: "立即了解",
          rationale: `适合${platform}需要快速建立可信度的投放。`
        },
        {
          title: "真实口碑证言",
          coreIdea: `让真实创作者体验${product}，把怀疑转化为信任。`,
          hook: `“我没想到${product}会有这个效果”真人开场。`,
          story: `创作者提出疑问 → 真实试用 → 展示结果 → 给出推荐结论。`,
          visualStyle: "手持、自然光、真实体验感",
          tone: "真实、亲近",
          shotList: ["真人开场", "开箱/首次接触", "使用演示", "结论 + CTA"],
          cta: "现在试试",
          rationale: `适合依赖口碑与真实场景驱动转化的产品。`
        },
        {
          title: "破圈吸睛开场",
          coreIdea: `用反差感开场打断滑动，再连接到${product}核心卖点。`,
          hook: "意外视觉反差或趣味转场，再揭示产品利益点。",
          story: `强反差抓住注意力 → 揭示产品是解决方案 → 快节奏叠加利益证明。`,
          visualStyle: "醒目字幕、节奏剪辑、高饱和",
          tone: "有趣、高能",
          shotList: ["反差开场", "产品揭示", "三连利益点", "高对比 CTA"],
          cta: "立即领取优惠",
          rationale: `适合信息流首帧需要强吸引力的环境。`
        }
      ];

  const enTemplates = parent
    ? [
        {
          title: `Deepen: ${parent.title}`,
          coreIdea: `Build on "${parent.coreIdea}" with sharper proof for ${product}.`,
          hook: parent.hook,
          story: `${parent.story} This version tightens pacing and information hierarchy.`,
          visualStyle: parent.visualStyle,
          tone: parent.tone,
          shotList: parent.shotList,
          cta: parent.cta,
          rationale: `Derivative anchored to the brand-selected direction "${parent.title}".`
        },
        {
          title: `${parent.title} · Fast-cut`,
          coreIdea: `Keep "${parent.coreIdea}" but increase retention with faster editing.`,
          hook: "Hook + product reveal within 3 seconds.",
          story: "Compress setup, stack three benefits, land on brand CTA.",
          visualStyle: "Fast cuts, bold captions, high contrast",
          tone: "Energetic, direct",
          shotList: ["Hook open", "Triple product proof", "Lifestyle montage", "Brand end card"],
          cta: parent.cta,
          rationale: `Optimized for fast-scroll ${platform} placements.`
        },
        {
          title: `${parent.title} · Premium`,
          coreIdea: `Elevate "${parent.coreIdea}" with more cinematic trust cues.`,
          hook: "Cinematic macro open to signal premium quality.",
          story: "Lead with polish, expand proof, close on brand tone.",
          visualStyle: "Shallow depth, slow push, refined lighting",
          tone: "Premium, credible",
          shotList: ["Macro hero", "Lifestyle proof", "Benefit stack", "Brand close"],
          cta: parent.cta,
          rationale: "Stays on the selected direction while increasing perceived value."
        }
      ]
    : [
        {
          title: "Cinematic Proof",
          coreIdea: `Make ${product} feel premium through polished proof moments.`,
          hook: `Hero shot of ${product} in motion within 2 seconds.`,
          story: brief
            ? `Aligned with brief: ${brief.slice(0, 120)}…`
            : "Move from tension to payoff: reveal, proof, brand moment.",
          visualStyle: "Premium lighting, shallow depth, slow push-ins",
          tone: "Confident, aspirational",
          shotList: ["Macro reveal", "Lifestyle scene", "Proof shot", "End card"],
          cta: "Shop now",
          rationale: `Strong when ${product} needs instant credibility on ${platform}.`
        },
        {
          title: "Authentic Testimonial",
          coreIdea: `Let a real creator experience ${product} and convert skepticism into trust.`,
          hook: `"I did not expect ${product} to work this well."`,
          story: "Curiosity → trial → result → recommendation.",
          visualStyle: "Handheld, natural light, authentic UGC",
          tone: "Honest, relatable",
          shotList: ["Creator hook", "Unbox / first use", "Before-after", "Recommendation"],
          cta: "Try it today",
          rationale: "Best when social proof drives consideration."
        },
        {
          title: "Pattern Interrupt",
          coreIdea: `Open with contrast, then connect attention to ${product}'s core benefit.`,
          hook: "Unexpected visual twist, then product payoff.",
          story: "Interrupt scroll → reveal solution → rapid benefit stack.",
          visualStyle: "Bold captions, punchy rhythm, saturated color",
          tone: "Playful, high energy",
          shotList: ["Contrast open", "Product reveal", "Benefit trio", "CTA close"],
          cta: "Claim the offer",
          rationale: "Built for thumb-stopping feed environments."
        }
      ];

  const templates = input.locale === "zh" ? zhTemplates : enTemplates;

  return templates.slice(0, count).map((item) => ({
    id: randomUUID(),
    title: item.title,
    summary: item.coreIdea,
    coreIdea: item.coreIdea,
    hook: item.hook,
    story: item.story,
    visualStyle: item.visualStyle,
    tone: item.tone,
    shotList: item.shotList,
    cta: item.cta,
    rationale: item.rationale,
    actor: input.actor,
    parentId: parent?.id,
    createdAt: now,
    status: "draft"
  }));
}
