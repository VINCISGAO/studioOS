import type { Locale } from "@/lib/i18n";

export type QueueGenerationModelIcon =
  | "openai"
  | "midjourney"
  | "banana"
  | "seedream";

export type QueueGenerationModelRow = {
  id: string;
  label: { zh: string; en: string };
  tierBadge?: { zh: string; en: string };
  daysBadge: { zh: string; en: string };
  icon: QueueGenerationModelIcon;
};

export const QUEUE_GENERATION_MODELS: QueueGenerationModelRow[] = [
  {
    id: "gpt-image-1.5",
    label: { zh: "GPT Image 1.5", en: "GPT Image 1.5" },
    daysBadge: { zh: "311 天", en: "311 Days" },
    icon: "openai"
  },
  {
    id: "gpt-image-2",
    label: { zh: "GPT Image 2", en: "GPT Image 2" },
    tierBadge: { zh: "low 1K", en: "low 1K" },
    daysBadge: { zh: "311 天", en: "311 Days" },
    icon: "openai"
  },
  {
    id: "midjourney",
    label: { zh: "Midjourney", en: "Midjourney" },
    daysBadge: { zh: "311 天", en: "311 Days" },
    icon: "midjourney"
  },
  {
    id: "nano-banana",
    label: { zh: "Nano Banana", en: "Nano Banana" },
    daysBadge: { zh: "311 天", en: "311 Days" },
    icon: "banana"
  },
  {
    id: "nano-banana-2",
    label: { zh: "Nano Banana 2", en: "Nano Banana 2" },
    tierBadge: { zh: "512", en: "512" },
    daysBadge: { zh: "311 天", en: "311 Days" },
    icon: "banana"
  },
  {
    id: "nano-banana-pro",
    label: { zh: "Nano Banana Pro", en: "Nano Banana Pro" },
    tierBadge: { zh: "2K", en: "2K" },
    daysBadge: { zh: "311 天", en: "311 Days" },
    icon: "banana"
  },
  {
    id: "seedream-4",
    label: { zh: "Seedream 4", en: "Seedream 4" },
    daysBadge: { zh: "311 天", en: "311 Days" },
    icon: "seedream"
  },
  {
    id: "seedream-4.5",
    label: { zh: "Seedream 4.5", en: "Seedream 4.5" },
    daysBadge: { zh: "311 天", en: "311 Days" },
    icon: "seedream"
  }
];

export function queueGenerationCopy(locale: Locale) {
  return locale === "zh"
    ? {
        title: "无限低速生成",
        fastTitle: "快速生成",
        fastHint: "使用 Token 跳过排队，立即处理您的请求。",
        queueAria: "排队生成",
        fastAria: "快速生成"
      }
    : {
        title: "Unlimited low-speed generation",
        fastTitle: "Fast generation",
        fastHint: "Use tokens to skip the queue and process your request immediately.",
        queueAria: "Queue generation",
        fastAria: "Fast generation"
      };
}
