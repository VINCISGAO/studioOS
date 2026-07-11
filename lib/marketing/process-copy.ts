import type { Locale } from "@/lib/i18n";

export type ProcessStepId =
  | "brief"
  | "pricing"
  | "matching"
  | "production"
  | "review"
  | "delivery"
  | "escrow"
  | "complete";

export type ProcessCopy = {
  pageTitle: string;
  subtitle: string;
  intro: string[];
  highlights: Array<{ title: string; body: string }>;
  steps: Array<{
    id: ProcessStepId;
    number: string;
    title: string;
    body: string;
  }>;
  diagramTitle: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
};

const zh: ProcessCopy = {
  pageTitle: "流程",
  subtitle: "从需求到交付的完整流程",
  intro: [
    "VINCIS 将广告制作中的沟通、文件、修改、付款与交付整合在同一平台，让品牌与创作者之间的合作更加高效、透明、安全。",
    "从发布需求到最终交付，每一步都有清晰的状态与记录，减少反复沟通，让创意更快落地。"
  ],
  highlights: [
    { title: "高效协作", body: "标准化流程，让协作更高效" },
    { title: "透明可控", body: "全程记录，进度可追踪" },
    { title: "安全保障", body: "资金安全，隐私保护" },
    { title: "全球连接", body: "连接全球优质创作者" }
  ],
  steps: [
    {
      id: "brief",
      number: "01",
      title: "发布需求",
      body: "品牌方填写项目需求、上传素材、设定预算与交付时间，系统保存需求并进入付款前准备。"
    },
    {
      id: "pricing",
      number: "02",
      title: "AI 智能估价",
      body: "系统根据项目复杂度、时长、修改轮次与历史数据，自动计算合理报价区间，帮助品牌快速决策。"
    },
    {
      id: "matching",
      number: "03",
      title: "匹配创作者",
      body: "付款成功后，AI 根据风格、预算、能力与履约表现匹配全球创作者，并向合适人选发送合作邀约。"
    },
    {
      id: "production",
      number: "04",
      title: "正式开始制作",
      body: "品牌从已接受邀约的创作者中最终选定合作伙伴后，项目正式进入制作阶段，创作者可上传第一版视频。"
    },
    {
      id: "review",
      number: "05",
      title: "在线审片",
      body: "品牌在线观看视频、批注修改意见，所有反馈锚定在时间轴上，创作者实时收到通知并迭代新版本。"
    },
    {
      id: "delivery",
      number: "06",
      title: "最终交付",
      body: "项目通过后，创作者上传最终成片与项目文件，品牌可在平台内完成验收与归档。"
    },
    {
      id: "escrow",
      number: "07",
      title: "托管结算",
      body: "款项托管在平台，确认交付后按约定释放给创作者，全程可追溯、可审计。"
    },
    {
      id: "complete",
      number: "08",
      title: "项目完成",
      body: "项目归档完成，双方可查看完整合作记录、版本历史与结算信息，为下一次合作积累信任。"
    }
  ],
  diagramTitle: "一张图了解 VINCIS 流程",
  ctaTitle: "准备开始您的项目了吗？",
  ctaBody: "加入全球品牌与创作者的协作平台，让创意更快落地。",
  ctaButton: "发布项目需求"
};

const en: ProcessCopy = {
  pageTitle: "Process",
  subtitle: "From brief to delivery",
  intro: [
    "VINCIS brings communication, files, revisions, payments, and delivery into one platform so brands and creators can collaborate efficiently, transparently, and safely.",
    "From posting a requirement to final delivery, every step has a clear status and audit trail—less back-and-forth, faster creative output."
  ],
  highlights: [
    { title: "Efficient collaboration", body: "Standardized workflow for faster teamwork" },
    { title: "Transparent control", body: "Full records with trackable progress" },
    { title: "Secure escrow", body: "Protected funds and private data" },
    { title: "Global reach", body: "Connect with quality creators worldwide" }
  ],
  steps: [
    {
      id: "brief",
      number: "01",
      title: "Post requirements",
      body: "Brands submit project needs, upload assets, set budget and timeline. The system stores the brief before payment."
    },
    {
      id: "pricing",
      number: "02",
      title: "AI pricing",
      body: "The engine estimates a fair price range from complexity, duration, revision policy, and benchmark data."
    },
    {
      id: "matching",
      number: "03",
      title: "Match creators",
      body: "After payment, AI matches registered creators by style, budget, and track record, then sends invitations."
    },
    {
      id: "production",
      number: "04",
      title: "Start production",
      body: "Once the brand selects a creator who accepted the invite, the project goes active and V1 upload opens."
    },
    {
      id: "review",
      number: "05",
      title: "Online review",
      body: "Brands review on a timeline, leave timestamped notes, and creators iterate with real-time notifications."
    },
    {
      id: "delivery",
      number: "06",
      title: "Final delivery",
      body: "After approval, creators upload final masters and project files for brand acceptance and archiving."
    },
    {
      id: "escrow",
      number: "07",
      title: "Escrow settlement",
      body: "Funds stay in escrow until delivery is confirmed, then release to the creator with a full audit trail."
    },
    {
      id: "complete",
      number: "08",
      title: "Project complete",
      body: "The project is archived with version history and settlement records—ready for the next collaboration."
    }
  ],
  diagramTitle: "VINCIS process at a glance",
  ctaTitle: "Ready to start your project?",
  ctaBody: "Join the global brand–creator platform and ship creative work faster.",
  ctaButton: "Post a project"
};

export function processText(locale: Locale): ProcessCopy {
  return locale === "zh" ? zh : en;
}
