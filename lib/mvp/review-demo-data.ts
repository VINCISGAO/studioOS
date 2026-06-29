import type { Locale } from "@/lib/i18n";

export type GuidelineCheck = {
  id: string;
  label: string;
  passed: boolean;
  note?: string;
  time?: string;
};

export type TimelineMarker = {
  id: string;
  index: number;
  seconds: number;
  category: string;
  detail: string;
  status: "pass" | "warn";
};

export type AiSuggestion = { id: string; text: string; seconds?: number };

export type ConfidenceMetric = { label: string; value: number };

export type DeliverableFile = { id: string; name: string; size: string };

export type ChatMessage = {
  id: string;
  author: string;
  role: string;
  time: string;
  body: string;
  marker?: string;
};

export type CampaignStep = { title: string; subtitle: string };

const packs = {
  en: {
    steps: [
      { title: "Brief", subtitle: "Completed" },
      { title: "Concept", subtitle: "Completed" },
      { title: "Video", subtitle: "In review" },
      { title: "Review", subtitle: "Awaiting feedback" },
      { title: "Delivered", subtitle: "Pending" }
    ] as CampaignStep[],
    guidelines: [
      { id: "g1", label: "Brand logo safe area", passed: true },
      { id: "g2", label: "Color specs", passed: true },
      { id: "g3", label: "Video duration (28s)", passed: true },
      { id: "g4", label: "Subtitle safe area", passed: true },
      { id: "g5", label: "CTA detection", passed: true },
      { id: "g6", label: "Resolution (1080×1920)", passed: true },
      { id: "g7", label: "Brand logo appears too late", passed: false, note: "", time: "00:03" },
      { id: "g8", label: "Product display too short", passed: false, note: "", time: "00:08" }
    ] as GuidelineCheck[],
    timeline: [
      { id: "t1", index: 1, seconds: 3, category: "Brand exposure", detail: "Logo appears too late", status: "warn" as const },
      { id: "t2", index: 2, seconds: 8, category: "Product display", detail: "Product shot too short", status: "warn" as const },
      { id: "t3", index: 3, seconds: 13, category: "Copy / subtitles", detail: "Passed", status: "pass" as const },
      { id: "t4", index: 4, seconds: 17, category: "CTA", detail: "CTA not prominent enough", status: "warn" as const },
      { id: "t5", index: 5, seconds: 23, category: "Scene transition", detail: "Passed", status: "pass" as const }
    ],
    suggestions: [
      { id: "s1", text: "Move logo to 00:01", seconds: 1 },
      { id: "s2", text: "Extend product close-up to 2s", seconds: 8 },
      { id: "s3", text: "Increase CTA contrast", seconds: 17 },
      { id: "s4", text: "Add subtitle at 00:08", seconds: 8 },
      { id: "s5", text: "Brighten opening shot", seconds: 2 }
    ],
    confidence: [
      { label: "Audience appeal", value: 94 },
      { label: "Brand fit", value: 98 },
      { label: "Creative expression", value: 92 },
      { label: "Conversion potential", value: 89 }
    ],
    deliverables: [
      { id: "d1", name: "Hero_film_v2.mp4", size: "24 MB" },
      { id: "d2", name: "Hero_film_v2.mov", size: "48 MB" },
      { id: "d3", name: "Thumbnail.jpg", size: "1.2 MB" },
      { id: "d4", name: "Vertical_9x16.mp4", size: "22 MB" }
    ],
    chat: [
      {
        id: "c1",
        author: "Lily",
        role: "Brand",
        time: "10:24",
        body: "Reviewed the 00:03 marker — logo needs to appear one second earlier.",
        marker: "00:03"
      },
      {
        id: "c2",
        author: "Jack",
        role: "Creator",
        time: "10:31",
        body: "Got it. Will adjust logo timing and extend the product shot in v3.",
        marker: "00:08"
      }
    ] as ChatMessage[],
    versionRows: [
      { version: 2, label: "Current", status: "revision" as const, time: "Jun 28, 14:00" },
      { version: 1, label: "v1", status: "rejected" as const, time: "Jun 27, 18:20" },
      { version: 0, label: "v0", status: "rejected" as const, time: "Jun 26, 11:05" }
    ]
  },
  zh: {
    steps: [
      { title: "Brief", subtitle: "已完成" },
      { title: "Concept", subtitle: "已完成" },
      { title: "Video", subtitle: "审片中" },
      { title: "Review", subtitle: "等待反馈" },
      { title: "Delivered", subtitle: "待交付" }
    ] as CampaignStep[],
    guidelines: [
      { id: "g1", label: "品牌 Logo 安全区", passed: true },
      { id: "g2", label: "色彩规范", passed: true },
      { id: "g3", label: "视频时长 (28s)", passed: true },
      { id: "g4", label: "字幕安全区", passed: true },
      { id: "g5", label: "CTA 检测", passed: true },
      { id: "g6", label: "分辨率 (1080×1920)", passed: true },
      { id: "g7", label: "品牌 Logo 出现偏晚", passed: false, time: "00:03" },
      { id: "g8", label: "产品展示时长过短", passed: false, time: "00:08" }
    ] as GuidelineCheck[],
    timeline: [
      { id: "t1", index: 1, seconds: 3, category: "品牌曝光", detail: "Logo 出现偏晚", status: "warn" as const },
      { id: "t2", index: 2, seconds: 8, category: "产品展示", detail: "产品镜头过短", status: "warn" as const },
      { id: "t3", index: 3, seconds: 13, category: "文案字幕", detail: "已通过", status: "pass" as const },
      { id: "t4", index: 4, seconds: 17, category: "CTA", detail: "CTA 不够突出", status: "warn" as const },
      { id: "t5", index: 5, seconds: 23, category: "场景转场", detail: "已通过", status: "pass" as const }
    ],
    suggestions: [
      { id: "s1", text: "Logo 提前至 00:01 出现", seconds: 1 },
      { id: "s2", text: "产品特写延长至 2 秒", seconds: 8 },
      { id: "s3", text: "增强 CTA 对比度", seconds: 17 },
      { id: "s4", text: "00:08 处添加字幕", seconds: 8 },
      { id: "s5", text: "开场镜头提亮", seconds: 2 }
    ],
    confidence: [
      { label: "受众吸引力", value: 94 },
      { label: "品牌契合", value: 98 },
      { label: "创意表达", value: 92 },
      { label: "转化潜力", value: 89 }
    ],
    deliverables: [
      { id: "d1", name: "Hero_film_v2.mp4", size: "24 MB" },
      { id: "d2", name: "Hero_film_v2.mov", size: "48 MB" },
      { id: "d3", name: "Thumbnail.jpg", size: "1.2 MB" },
      { id: "d4", name: "Vertical_9x16.mp4", size: "22 MB" }
    ],
    chat: [
      {
        id: "c1",
        author: "Lily",
        role: "品牌",
        time: "10:24",
        body: "00:03 标记已看，Logo 需要再提前 1 秒出现。",
        marker: "00:03"
      },
      {
        id: "c2",
        author: "Jack",
        role: "创作者",
        time: "10:31",
        body: "收到，v3 会调整 Logo 时间并延长产品镜头。",
        marker: "00:08"
      }
    ] as ChatMessage[],
    versionRows: [
      { version: 2, label: "当前", status: "revision" as const, time: "6月28日 14:00" },
      { version: 1, label: "v1", status: "rejected" as const, time: "6月27日 18:20" },
      { version: 0, label: "v0", status: "rejected" as const, time: "6月26日 11:05" }
    ]
  }
};

export function getReviewDemoData(locale: Locale) {
  const pack = packs[locale];
  return {
    aiScore: 94,
    steps: pack.steps,
    activeStepIndex: 2,
    guidelines: pack.guidelines,
    timeline: pack.timeline as TimelineMarker[],
    suggestions: pack.suggestions as AiSuggestion[],
    confidence: pack.confidence as ConfidenceMetric[],
    deliverables: pack.deliverables as DeliverableFile[],
    chat: pack.chat,
    versionRows: pack.versionRows,
    pinPositions: [
      { x: 28, y: 32 },
      { x: 52, y: 48 },
      { x: 70, y: 35 },
      { x: 38, y: 58 },
      { x: 62, y: 65 }
    ]
  };
}

export function versionStatusLabel(
  status: "approved" | "revision" | "rejected" | "reviewing",
  locale: Locale
) {
  const map = {
    en: { approved: "Approved", revision: "Revising", rejected: "Rejected", reviewing: "In review" },
    zh: { approved: "已通过", revision: "修改中", rejected: "拒绝", reviewing: "审片中" }
  };
  return map[locale][status];
}
