"use client";

import { computeKnowledgeSeoScores } from "@/features/knowledge-center/knowledge-seo.heuristics";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { knowledgeEditorSeoTips } from "@/lib/knowledge/knowledge-editor-validation";
import type { KnowledgeEditorFormState } from "@/lib/knowledge/knowledge-editor-validation";
import type { Locale } from "@/lib/i18n";

export function KnowledgeEditorSeoCard({
  locale,
  form,
  onChange
}: {
  locale: Locale;
  form: Pick<KnowledgeEditorFormState, "title" | "subtitle" | "body_markdown" | "seo_title" | "meta_description" | "focus_keywords">;
  onChange: (patch: Pick<Partial<KnowledgeEditorFormState>, "title" | "subtitle" | "body_markdown" | "seo_title" | "meta_description" | "focus_keywords">) => void;
}) {
  const zh = locale === "zh";
  const scores = computeKnowledgeSeoScores({
    translation: {
      title: form.title,
      subtitle: form.subtitle,
      body_markdown: form.body_markdown,
      excerpt: form.meta_description
    },
    seo: { meta_description: form.meta_description }
  });
  const tips = knowledgeEditorSeoTips(
    {
      ...form,
      slug: "",
      category_slug: "ai-advertising",
      tags: [],
      cover_image_url: "",
      cover_fallback_url: "",
      status: "DRAFT",
      visibility: "PUBLIC"
    },
    zh
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">{zh ? "SEO 优化" : "SEO"}</h3>
        <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-[#5B5CEB]">
          {scores.seo_score} / 100
        </div>
      </div>
      <div className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-zinc-600">{zh ? "SEO 标题" : "SEO Title"}</label>
          <Input className="mt-1" value={form.seo_title} onChange={(event) => onChange({ seo_title: event.target.value })} maxLength={60} />
          <p className="mt-1 text-xs text-zinc-400">{form.seo_title.length} / 60</p>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">{zh ? "页面描述" : "Meta Description"}</label>
          <Textarea className="mt-1" rows={4} value={form.meta_description} onChange={(event) => onChange({ meta_description: event.target.value })} maxLength={160} />
          <p className="mt-1 text-xs text-zinc-400">{form.meta_description.length} / 160</p>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">{zh ? "核心关键词" : "Focus Keywords"}</label>
          <Input
            className="mt-1"
            value={form.focus_keywords}
            onChange={(event) => onChange({ focus_keywords: event.target.value })}
            placeholder={zh ? "AI 广告, 视频广告" : "AI advertising, video ads"}
          />
        </div>
      </div>
      {tips.length ? (
        <ul className="mt-4 space-y-1 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {tips.map((tip) => (
            <li key={tip}>• {tip}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-emerald-700">{zh ? "SEO 基础项表现良好。" : "SEO fundamentals look good."}</p>
      )}
    </section>
  );
}
