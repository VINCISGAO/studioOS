import type { Locale } from "@/lib/i18n";

export type CopilotAction =
  | "brief"
  | "script"
  | "storyboard"
  | "shot_list"
  | "prompt"
  | "subtitle"
  | "voice"
  | "cta";

export type CopilotContext = {
  productUrl?: string;
  campaignGoal?: string;
  audience?: string;
  style?: string;
  projectTitle?: string;
  requirements?: string;
  brandName?: string;
  platform?: string;
  budgetRange?: string;
};

export const copilotActions: {
  id: CopilotAction;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
}[] = [
  {
    id: "brief",
    label: { en: "Generate Brief", zh: "生成 Brief" },
    description: { en: "Structured creative brief from product & goal", zh: "根据产品与目标生成结构化 Brief" }
  },
  {
    id: "script",
    label: { en: "Generate Script", zh: "生成脚本" },
    description: { en: "15s voiceover + scene beats", zh: "15 秒旁白与场景节拍" }
  },
  {
    id: "storyboard",
    label: { en: "Generate Storyboard", zh: "生成分镜" },
    description: { en: "Frame-by-frame visual plan", zh: "逐帧视觉方案" }
  },
  {
    id: "shot_list",
    label: { en: "Generate Shot List", zh: "生成镜头表" },
    description: { en: "Camera, duration, asset per shot", zh: "每镜头机位、时长与素材" }
  },
  {
    id: "prompt",
    label: { en: "Generate Prompt", zh: "生成 Prompt" },
    description: { en: "AI video generation prompts per scene", zh: "各场景 AI 视频生成 Prompt" }
  },
  {
    id: "subtitle",
    label: { en: "Generate Subtitle", zh: "生成字幕" },
    description: { en: "Timed captions in safe area", zh: "安全区内时间轴字幕" }
  },
  {
    id: "voice",
    label: { en: "Generate Voice", zh: "生成配音" },
    description: { en: "Voice direction + sample script", zh: "配音方向与示例稿" }
  },
  {
    id: "cta",
    label: { en: "Generate CTA", zh: "生成 CTA" },
    description: { en: "End-card copy and placement", zh: "尾帧文案与位置" }
  }
];

export function generateCopilotOutput(action: CopilotAction, ctx: CopilotContext, locale: Locale): string {
  const style = ctx.style?.trim() || (locale === "zh" ? "极简商业" : "Minimal commercial");
  const goal = ctx.campaignGoal?.trim() || (locale === "zh" ? "转化" : "Sales");
  const product = ctx.productUrl?.trim() || ctx.brandName?.trim() || (locale === "zh" ? "（请填写产品链接）" : "(add product URL)");
  const audience = ctx.audience?.trim() || (locale === "zh" ? "25–40 岁移动端购物用户" : "US mobile shoppers 25–40");
  const title = ctx.projectTitle?.trim() || (locale === "zh" ? "Campaign" : "Campaign");
  const requirements = ctx.requirements?.trim() || "";
  const platform = ctx.platform?.trim() || "TikTok / Meta";
  const briefContext = requirements
    ? locale === "zh"
      ? `\n\n## 客户 Brief\n${requirements}`
      : `\n\n## Client brief\n${requirements}`
    : "";

  const outputs: Record<CopilotAction, { en: string; zh: string }> = {
    brief: {
      en: `# Creative Brief — ${title}\n\n**Brand:** ${ctx.brandName || "—"}\n**Product:** ${product}\n**Goal:** ${goal}\n**Audience:** ${audience}\n**Platforms:** ${platform}\n**Style ref:** ${style}${briefContext}\n\n## Key message\nTurn product proof into a 9:16 performance ad with a macro hook, three benefit beats, and a single CTA.\n\n## Deliverables\n- 1× TikTok 9:16 (15s)\n- 1× Meta feed 1:1 cutdown\n- Safe-area subtitles\n\n## Success metrics\nCTR lift, 3s hook retention > 45%`,
      zh: `# Creative Brief — ${title}\n\n**品牌：** ${ctx.brandName || "—"}\n**产品：** ${product}\n**目标：** ${goal}\n**受众：** ${audience}\n**平台：** ${platform}\n**风格参考：** ${style}${briefContext}\n\n## 核心信息\n将产品卖点转化为 9:16 效果广告：宏观开场钩子、三个利益点、单一 CTA。\n\n## 交付物\n- 1× TikTok 9:16（15 秒）\n- 1× Meta 1:1 精简版\n- 安全区字幕\n\n## 成功指标\nCTR 提升，3 秒留存 > 45%`
    },
    script: {
      en: `[0:00–0:02] HOOK — Macro product reveal. VO: "This changes your morning."\n[0:02–0:06] PROOF — Feature demo. VO: "Designed for ${audience.split(" ")[0]} who want results, not hype."\n[0:06–0:11] SOCIAL PROOF — Quick testimonial overlay.\n[0:11–0:15] CTA — Logo + "Shop now" lower third.`,
      zh: `[0:00–0:02] 钩子 — 产品宏观特写。旁白："这会改变你的早晨。"\n[0:02–0:06] 证明 — 功能演示。旁白："为想要结果、不要噱头的用户设计。"\n[0:06–0:11] 社会证明 — 快速证言叠加。\n[0:11–0:15] CTA — Logo +「立即购买」下三分之一。`
    },
    storyboard: {
      en: `Frame 1 (0:00) — Extreme close-up, shallow DOF, ${style} lighting\nFrame 2 (0:03) — Product in use, handheld UGC feel\nFrame 3 (0:07) — Split screen before/after\nFrame 4 (0:11) — End card, logo 14% width, CTA button\nFrame 5 (0:14) — Hold frame, music tail`,
      zh: `镜头 1 (0:00) — 极近特写，浅景深，${style} 光感\n镜头 2 (0:03) — 使用场景，手持 UGC 感\n镜头 3 (0:07) — 前后对比分屏\n镜头 4 (0:11) — 尾帧，Logo 14% 宽度，CTA 按钮\n镜头 5 (0:14) — 定帧，音乐尾音`
    },
    shot_list: {
      en: `| # | Duration | Type | Notes |\n|---|----------|------|-------|\n| 1 | 2.0s | Macro | Product hero, 120fps slow-mo |\n| 2 | 3.5s | Medium | Hands-on demo |\n| 3 | 2.5s | Graphic | Stat overlay |\n| 4 | 2.0s | Wide | Lifestyle context |\n| 5 | 5.0s | End card | Logo + CTA |`,
      zh: `| # | 时长 | 类型 | 备注 |\n|---|------|------|------|\n| 1 | 2.0s | 宏观 | 产品英雄镜头，120fps 慢动作 |\n| 2 | 3.5s | 中景 | 上手演示 |\n| 3 | 2.5s | 图形 | 数据叠加 |\n| 4 | 2.0s | 全景 | 生活方式场景 |\n| 5 | 5.0s | 尾帧 | Logo + CTA |`
    },
    prompt: {
      en: `Scene 1: "Cinematic macro product shot, ${style} aesthetic, soft rim light, 9:16, photorealistic, 4K"\nScene 2: "Authentic UGC hands holding product, natural window light, shallow depth of field"\nScene 3: "Minimal motion graphics stat reveal, brand colors, clean typography"\nScene 4: "Premium end card, logo center-bottom, shop now button, black background"`,
      zh: `场景 1："电影感产品宏观特写，${style} 美学，柔和轮廓光，9:16，照片级真实，4K"\n场景 2："真实 UGC 手持产品，自然窗光，浅景深"\n场景 3："极简动态图形数据展示，品牌色，干净字体"\n场景 4："高级尾帧，Logo 中下，购买按钮，黑色背景"`
    },
    subtitle: {
      en: `00:00.0 → 00:02.0  "This changes your morning."\n00:02.5 → 00:06.0  "Results you can see in days."\n00:06.5 → 00:10.0  "Trusted by 50,000+ customers."\n00:11.0 → 00:14.5  "Shop now — link in bio"\n\nSafe area: bottom 20%, max 2 lines, 48px min on 1080×1920`,
      zh: `00:00.0 → 00:02.0  "这会改变你的早晨。"\n00:02.5 → 00:06.0  "几天可见的效果。"\n00:06.5 → 00:10.0  "50,000+ 用户信赖。"\n00:11.0 → 00:14.5  "立即购买 — 链接在简介"\n\n安全区：底部 20%，最多 2 行，1080×1920 最小 48px`
    },
    voice: {
      en: `Voice profile: Calm US female, mid-30s, conversational (not announcer)\nPacing: 140 WPM, warm tone, slight smile\nDirection: Emphasize "morning" and "results" — pause 0.3s before CTA\nSample: "This changes your morning. Real results, zero compromise. Shop now."`,
      zh: `配音档案：沉稳美式女声，30 多岁，对话感（非播音腔）\n节奏：140 词/分钟，温暖语气，轻微笑意\n指导：强调「早晨」与「效果」— CTA 前停顿 0.3 秒\n示例："这会改变你的早晨。真实效果，零妥协。立即购买。"`
    },
    cta: {
      en: `Primary: "Shop now"\nSecondary: "Free shipping today"\nPlacement: Lower third, white text on 60% black bar\nTiming: 0:11–0:15 (min 3.5s hold)\nA/B variant: "Get yours" for retargeting audiences`,
      zh: `主 CTA："立即购买"\n副文案："今日免运费"\n位置：下三分之一，白字 + 60% 黑底条\n时长：0:11–0:15（至少停留 3.5 秒）\nA/B 变体：再营销受众用「马上入手」`
    }
  };

  return outputs[action][locale];
}
