import type { KnowledgeArticleStatus } from "@prisma/client";
import { slugifyKnowledgeTitle } from "@/features/knowledge-center/knowledge-seo.heuristics";
import { KNOWLEDGE_SLUG_MAX_LENGTH, KNOWLEDGE_VISIBILITY_OPTIONS } from "@/lib/knowledge/knowledge-editor.constants";

export type KnowledgeVisibility = (typeof KNOWLEDGE_VISIBILITY_OPTIONS)[number];

export type KnowledgeEditorFormState = {
  title: string;
  slug: string;
  subtitle: string;
  body_markdown: string;
  seo_title: string;
  meta_description: string;
  focus_keywords: string;
  category_slug: string;
  tags: string[];
  cover_image_url: string;
  cover_fallback_url: string;
  status: KnowledgeArticleStatus;
  visibility: KnowledgeVisibility;
};

export function normalizeKnowledgeSlug(value: string) {
  return slugifyKnowledgeTitle(value).slice(0, KNOWLEDGE_SLUG_MAX_LENGTH);
}

export function validateKnowledgeSlug(value: string) {
  const slug = value.trim();
  if (!slug) return { ok: false as const, message: "Slug is required." };
  if (slug.length > KNOWLEDGE_SLUG_MAX_LENGTH) {
    return { ok: false as const, message: `Slug must be ≤ ${KNOWLEDGE_SLUG_MAX_LENGTH} characters.` };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false as const, message: "Use lowercase letters, numbers, and hyphens only." };
  }
  return { ok: true as const };
}

export function knowledgeEditorPublishIssues(form: KnowledgeEditorFormState, zh = false) {
  const issues: string[] = [];
  if (!form.title.trim()) issues.push(zh ? "标题必填" : "Title is required");
  if (!validateKnowledgeSlug(form.slug).ok) issues.push(zh ? "URL 别名无效" : "Valid slug is required");
  if (!form.body_markdown.trim()) issues.push(zh ? "Markdown 正文必填" : "Markdown body is required");
  if (!form.seo_title.trim()) issues.push(zh ? "SEO 标题必填" : "SEO title is required");
  if (!form.meta_description.trim()) issues.push(zh ? "页面描述必填" : "Meta description is required");
  if (!form.category_slug) issues.push(zh ? "请选择分类" : "Category is required");
  if (!form.tags.length) issues.push(zh ? "至少添加一个标签" : "At least one tag is required");
  if (!form.cover_image_url.trim()) issues.push(zh ? "建议上传封面图" : "Cover image is recommended");
  return issues;
}

export function knowledgeEditorSeoTips(form: KnowledgeEditorFormState, zh = false) {
  const tips: string[] = [];
  const seoTitle = form.seo_title.trim();
  const meta = form.meta_description.trim();
  const keywords = form.focus_keywords.split(",").map((item) => item.trim()).filter(Boolean);
  const headings = (form.body_markdown.match(/^#{1,3}\s/mg) ?? []).length;

  if (seoTitle.length > 60) tips.push(zh ? "SEO 标题偏长" : "SEO title is too long");
  if (seoTitle.length < 30) tips.push(zh ? "SEO 标题偏短" : "SEO title is short");
  if (meta.length < 80) tips.push(zh ? "页面描述偏短" : "Meta description is too short");
  if (meta.length > 160) tips.push(zh ? "页面描述偏长" : "Meta description is too long");
  if (keywords.length > 8) tips.push(zh ? "关键词过多" : "Too many focus keywords");
  if (headings < 2) tips.push(zh ? "正文标题层级不足" : "Add more headings (## / ###)");
  return tips;
}
