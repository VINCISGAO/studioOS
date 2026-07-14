import type { Locale } from "@/lib/i18n";
import {
  KNOWLEDGE_EDITOR_CATEGORIES,
  KNOWLEDGE_PUBLISH_STATUSES,
  KNOWLEDGE_TAG_SUGGESTIONS,
  KNOWLEDGE_VISIBILITY_OPTIONS
} from "@/lib/knowledge/knowledge-editor.constants";

export function knowledgeEditorIsZh(locale: Locale) {
  return locale === "zh";
}

export const KNOWLEDGE_EDITOR_CATEGORY_LABELS_ZH: Record<(typeof KNOWLEDGE_EDITOR_CATEGORIES)[number]["slug"], string> = {
  "ai-advertising": "AI 广告",
  "ai-video": "AI 视频",
  "brand-marketing": "品牌营销",
  "creative-strategy": "创意策略",
  "industry-trends": "行业趋势",
  "case-study": "案例研究",
  tutorial: "教程",
  "company-news": "公司动态"
};

export const KNOWLEDGE_EDITOR_TAG_SUGGESTIONS_ZH: Record<(typeof KNOWLEDGE_TAG_SUGGESTIONS)[number], string> = {
  "AI Advertising": "AI 广告",
  "Artificial Intelligence": "人工智能",
  Marketing: "营销",
  "Video Ads": "视频广告",
  Brand: "品牌",
  Creative: "创意",
  TikTok: "TikTok",
  Performance: "效果投放",
  Lucien: "Lucien",
  SEO: "SEO"
};

export const KNOWLEDGE_PUBLISH_STATUS_LABELS_ZH: Record<(typeof KNOWLEDGE_PUBLISH_STATUSES)[number], string> = {
  DRAFT: "草稿",
  REVIEW: "审核中",
  SCHEDULED: "定时发布",
  PUBLISHED: "已发布"
};

export const KNOWLEDGE_VISIBILITY_LABELS_ZH: Record<(typeof KNOWLEDGE_VISIBILITY_OPTIONS)[number], string> = {
  PUBLIC: "公开",
  PRIVATE: "私有",
  INTERNAL: "内部"
};

export function knowledgeEditorCategoryLabel(slug: string, zh: boolean) {
  if (!zh) {
    return KNOWLEDGE_EDITOR_CATEGORIES.find((item) => item.slug === slug)?.name ?? slug;
  }
  return KNOWLEDGE_EDITOR_CATEGORY_LABELS_ZH[slug as keyof typeof KNOWLEDGE_EDITOR_CATEGORY_LABELS_ZH] ?? slug;
}

export function knowledgeEditorTagSuggestionLabel(tag: string, zh: boolean) {
  if (!zh) return tag;
  return KNOWLEDGE_EDITOR_TAG_SUGGESTIONS_ZH[tag as keyof typeof KNOWLEDGE_EDITOR_TAG_SUGGESTIONS_ZH] ?? tag;
}

export function knowledgeEditorPublishStatusLabel(status: string, zh: boolean) {
  if (!zh) return status;
  return KNOWLEDGE_PUBLISH_STATUS_LABELS_ZH[status as keyof typeof KNOWLEDGE_PUBLISH_STATUS_LABELS_ZH] ?? status;
}

export function knowledgeEditorVisibilityLabel(visibility: string, zh: boolean) {
  if (!zh) return visibility;
  return KNOWLEDGE_VISIBILITY_LABELS_ZH[visibility as keyof typeof KNOWLEDGE_VISIBILITY_LABELS_ZH] ?? visibility;
}

export function knowledgeEditorSlugValidationMessage(message: string, zh: boolean) {
  if (!zh) return message;
  if (message === "Slug is required.") return "URL 别名必填。";
  if (message.startsWith("Slug must be ≤")) return `URL 别名不能超过 ${message.match(/\d+/)?.[0] ?? "120"} 个字符。`;
  if (message === "Use lowercase letters, numbers, and hyphens only.") {
    return "仅可使用小写字母、数字和连字符。";
  }
  if (message === "This slug is already used by another article.") return "该 URL 别名已被其他文章占用。";
  return message;
}

export const KNOWLEDGE_MARKDOWN_MODE_LABELS = {
  markdown: { en: "Edit", zh: "编辑" },
  split: { en: "Split", zh: "分屏" },
  preview: { en: "Preview", zh: "预览" }
} as const;

export const KNOWLEDGE_MARKDOWN_TOOLBAR_LABELS = {
  h1: { en: "Heading 1", zh: "一级标题" },
  h2: { en: "Heading 2", zh: "二级标题" },
  h3: { en: "Heading 3", zh: "三级标题" },
  bold: { en: "Bold", zh: "加粗" },
  italic: { en: "Italic", zh: "斜体" },
  quote: { en: "Quote", zh: "引用" },
  code: { en: "Code", zh: "代码" },
  list: { en: "Bullet list", zh: "无序列表" },
  ordered: { en: "Numbered list", zh: "有序列表" },
  link: { en: "Link", zh: "链接" },
  image: { en: "Image", zh: "图片" },
  divider: { en: "Divider", zh: "分割线" }
} as const;

export function knowledgeMarkdownToolbarLabel(key: keyof typeof KNOWLEDGE_MARKDOWN_TOOLBAR_LABELS, zh: boolean) {
  return KNOWLEDGE_MARKDOWN_TOOLBAR_LABELS[key][zh ? "zh" : "en"];
}

export function knowledgeMarkdownModeLabel(mode: keyof typeof KNOWLEDGE_MARKDOWN_MODE_LABELS, zh: boolean) {
  return KNOWLEDGE_MARKDOWN_MODE_LABELS[mode][zh ? "zh" : "en"];
}
