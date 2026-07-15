import type { KnowledgeArticleStatus } from "@prisma/client";
import { slugifyKnowledgeTitle } from "@/features/knowledge-center/knowledge-seo.heuristics";
import {
  KNOWLEDGE_EDITOR_CATEGORIES,
  KNOWLEDGE_SLUG_MAX_LENGTH,
  KNOWLEDGE_VISIBILITY_OPTIONS
} from "@/lib/knowledge/knowledge-editor.constants";
import { knowledgeHtmlIsEmpty } from "@/lib/knowledge/knowledge-html";

export type KnowledgeVisibility = (typeof KNOWLEDGE_VISIBILITY_OPTIONS)[number];

export type KnowledgeEditorFormState = {
  title: string;
  slug: string;
  subtitle: string;
  body_html: string;
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

export function defaultKnowledgeTagForCategory(categorySlug: string) {
  const category = KNOWLEDGE_EDITOR_CATEGORIES.find((item) => item.slug === categorySlug);
  return category?.name ?? "AI Advertising";
}

export function effectiveKnowledgeSeoTitle(form: KnowledgeEditorFormState) {
  return form.title.trim();
}

export function effectiveKnowledgeMetaDescription(form: KnowledgeEditorFormState) {
  return form.subtitle.trim() || form.title.trim();
}

export function effectiveKnowledgeTags(form: KnowledgeEditorFormState) {
  if (form.tags.length) return form.tags;
  if (!form.category_slug) return [];
  return [defaultKnowledgeTagForCategory(form.category_slug)];
}

export function knowledgeEditorPublishGate(form: KnowledgeEditorFormState, zh = false) {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!form.title.trim()) blockers.push(zh ? "标题必填" : "Title is required");
  if (knowledgeHtmlIsEmpty(form.body_html)) blockers.push(zh ? "正文必填" : "Body is required");
  if (!form.category_slug) blockers.push(zh ? "请选择分类" : "Category is required");
  if (!form.subtitle.trim()) {
    warnings.push(zh ? "未填写副标题，发布后将使用标题作为页面描述" : "No subtitle — title will be used as meta description");
  }
  if (!form.cover_image_url.trim()) warnings.push(zh ? "建议上传封面图" : "Cover image is recommended");
  if (!form.tags.length && form.category_slug) {
    warnings.push(
      zh
        ? `未添加标签，发布时将自动使用「${defaultKnowledgeTagForCategory(form.category_slug)}」`
        : `No tags yet — "${defaultKnowledgeTagForCategory(form.category_slug)}" will be applied on publish`
    );
  }

  return { blockers, warnings };
}
