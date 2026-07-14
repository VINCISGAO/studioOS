"use client";

import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import type { KnowledgeArticleDetailDto } from "@/features/knowledge-center/knowledge-center.types";
import type { KnowledgePublishPipelineResult } from "@/features/knowledge-center/knowledge-publish.pipeline";
import type { Locale } from "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EditorProps = {
  locale: Locale;
  articleId?: string;
  initial?: KnowledgeArticleDetailDto | null;
};

export function AdminKnowledgeEditorPanel({ locale, articleId, initial }: EditorProps) {
  const zh = locale === "zh";
  const router = useRouter();
  const translation = initial?.translations[0];
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: translation?.title ?? "",
    slug: initial?.slug ?? "",
    category_slug: initial?.category_slug ?? "help-center",
    author_name: initial?.author_name ?? "VINCIS",
    status: initial?.status ?? "DRAFT",
    language_code: translation?.language_code ?? (locale === "zh" ? "zh-CN" : "en"),
    subtitle: translation?.subtitle ?? "",
    excerpt: translation?.excerpt ?? "",
    body_markdown: translation?.body_markdown ?? "",
    seo_title: translation?.seo?.seo_title ?? "",
    meta_description: translation?.seo?.meta_description ?? "",
    ai_summary: translation?.lucien?.ai_summary ?? "",
    ai_keywords: (translation?.lucien?.ai_keywords ?? []).join(", "),
    lucien_learning: translation?.lucien?.lucien_learning ?? true
  });

  async function save(publish = false) {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        category_slug: form.category_slug,
        author_name: form.author_name,
        status: publish ? "PUBLISHED" : form.status,
        translation: {
          language_code: form.language_code,
          title: form.title,
          subtitle: form.subtitle,
          excerpt: form.excerpt,
          body_markdown: form.body_markdown,
          status: publish ? "PUBLISHED" : form.status,
          seo: {
            seo_title: form.seo_title,
            meta_description: form.meta_description
          },
          lucien: {
            ai_summary: form.ai_summary,
            ai_keywords: form.ai_keywords.split(",").map((item) => item.trim()).filter(Boolean),
            lucien_learning: form.lucien_learning
          }
        }
      };

      const response = await fetch(articleId ? `/api/admin/knowledge/${articleId}` : "/api/admin/knowledge", {
        method: articleId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as {
        data?: {
          article?: KnowledgeArticleDetailDto;
          pipeline?: KnowledgePublishPipelineResult;
        };
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(body.error?.message ?? (zh ? "保存失败" : "Save failed"));

      const saved = body.data?.article;
      const pipeline = body.data?.pipeline;
      if (!articleId && saved?.id) {
        router.replace(adminPortalRoutes.knowledgeEdit(saved.id));
      }

      if (publish && pipeline?.published) {
        setMessage(
          zh
            ? `已发布。自动完成：${pipeline.steps.length} 项（含 Lucien ${pipeline.lucien_synced} 条）。`
            : `Published. Auto-completed ${pipeline.steps.length} steps (Lucien ${pipeline.lucien_synced} rows).`
        );
      } else {
        setMessage(zh ? "已保存。" : "Saved.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : zh ? "保存失败" : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function syncLucien() {
    if (!articleId) return;
    setMessage(null);
    const response = await fetch(`/api/admin/knowledge/${articleId}/sync-lucien`, {
      method: "POST",
      headers: adminMutationHeaders()
    });
    if (!response.ok) {
      setMessage(zh ? "Lucien 同步失败" : "Lucien sync failed");
      return;
    }
    setMessage(zh ? "已同步到 Lucien。" : "Synced to Lucien.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={zh ? "标题" : "Title"}>
            <Input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} />
          </Field>
          <Field label="Slug">
            <Input value={form.slug} onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))} placeholder="/resources/how-to-write-a-creative-brief" />
          </Field>
        </div>
        <Field label={zh ? "副标题" : "Subtitle"}>
          <Input value={form.subtitle} onChange={(e) => setForm((c) => ({ ...c, subtitle: e.target.value }))} />
        </Field>
        <Field label="Markdown">
          <Textarea rows={18} value={form.body_markdown} onChange={(e) => setForm((c) => ({ ...c, body_markdown: e.target.value }))} />
        </Field>
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">SEO</h3>
          <div className="mt-3 space-y-3">
            <Field label={zh ? "SEO 标题" : "SEO title"}>
              <Input value={form.seo_title} onChange={(e) => setForm((c) => ({ ...c, seo_title: e.target.value }))} />
            </Field>
            <Field label="Meta Description">
              <Textarea rows={4} value={form.meta_description} onChange={(e) => setForm((c) => ({ ...c, meta_description: e.target.value }))} />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">{zh ? "发布后自动完成" : "On Publish, VINCIS automatically"}</p>
          <ul className="mt-2 space-y-1 text-emerald-800">
            <li>✓ {zh ? "生成文章页" : "Article page"}</li>
            <li>✓ sitemap.xml · RSS · llms.txt</li>
            <li>✓ Schema.org · {zh ? "站内搜索索引" : "site search index"}</li>
            <li>✓ Lucien {zh ? "学习" : "learning"} · {zh ? "分类页更新" : "category index"}</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
          <h3 className="text-sm font-semibold text-violet-900">Lucien</h3>
          <div className="mt-3 space-y-3">
            <Field label={zh ? "AI 摘要" : "AI summary"}>
              <Textarea rows={3} value={form.ai_summary} onChange={(e) => setForm((c) => ({ ...c, ai_summary: e.target.value }))} />
            </Field>
            <Field label={zh ? "AI 关键词" : "AI keywords"}>
              <Input value={form.ai_keywords} onChange={(e) => setForm((c) => ({ ...c, ai_keywords: e.target.value }))} />
            </Field>
            <Button type="button" variant="outline" onClick={() => void syncLucien()} disabled={!articleId}>
              {zh ? "同步 Lucien" : "Sync Lucien"}
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void save(false)} disabled={saving}>
            {saving ? (zh ? "保存中…" : "Saving…") : zh ? "保存草稿" : "Save draft"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => void save(true)} disabled={saving}>
            {zh ? "发布" : "Publish"}
          </Button>
          <Button asChild variant="ghost">
            <Link href={adminPortalRoutes.knowledge}>{zh ? "返回列表" : "Back to list"}</Link>
          </Button>
        </div>
        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
