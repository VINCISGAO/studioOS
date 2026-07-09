"use client";

import { useCallback, useEffect, useState } from "react";
import { adminMutationHeaders, readAdminCsrfToken } from "@/lib/studioos/admin-csrf-client";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { workCategories, platforms, videoFormats } from "@/lib/project-options";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState = {
  title: string;
  description: string;
  category: string;
  platform: string;
  format: string;
  thumbnail_url: string;
  video_url: string;
  featured_on_homepage: boolean;
  homepage_sort_order: number;
  sort_order: number;
  is_published: boolean;
};

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  category: workCategories[0],
  platform: platforms[0],
  format: videoFormats[0],
  thumbnail_url: "",
  video_url: "",
  featured_on_homepage: false,
  homepage_sort_order: 0,
  sort_order: 0,
  is_published: true
});

export function AdminMarketingShowcasePanel({ locale }: { locale: Locale }) {
  const [works, setWorks] = useState<MarketingShowcaseWorkDto[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isZh = locale === "zh";

  const loadWorks = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/marketing/showcase", { cache: "no-store" }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as { data?: { works?: MarketingShowcaseWorkDto[] } } | null;
    setWorks(payload?.data?.works ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadWorks();
  }, [loadWorks]);

  async function uploadVideo(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/admin/marketing/showcase/upload", {
        method: "POST",
        headers: adminMutationHeaders(),
        body: formData
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { video_url?: string };
        error?: string | { message?: string };
      } | null;
      if (!response.ok || !payload?.data?.video_url) {
        const apiError =
          typeof payload?.error === "string" ? payload.error : payload?.error?.message;
        throw new Error(apiError ?? (isZh ? "上传失败" : "Upload failed"));
      }
      setForm((current) => ({ ...current, video_url: payload.data!.video_url! }));
      setMessage(isZh ? "视频已上传。" : "Video uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isZh ? "上传失败" : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function saveWork() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(
        editingId ? `/api/admin/marketing/showcase/${editingId}` : "/api/admin/marketing/showcase",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...adminMutationHeaders()
          },
          body: JSON.stringify(form)
        }
      );
      const payload = (await response.json().catch(() => null)) as {
        error?: string | { message?: string };
      } | null;
      if (!response.ok) {
        const apiError =
          typeof payload?.error === "string" ? payload.error : payload?.error?.message;
        throw new Error(apiError ?? (isZh ? "保存失败" : "Save failed"));
      }
      setForm(emptyForm());
      setEditingId(null);
      setMessage(isZh ? "已保存。" : "Saved.");
      await loadWorks();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isZh ? "保存失败" : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeWork(id: string) {
    if (!window.confirm(isZh ? "确定删除该作品？" : "Delete this work?")) return;
    await fetch(`/api/admin/marketing/showcase/${id}`, {
      method: "DELETE",
      headers: adminMutationHeaders()
    });
    await loadWorks();
  }

  function startEdit(work: MarketingShowcaseWorkDto) {
    setEditingId(work.id);
    setForm({
      title: work.title,
      description: work.description,
      category: work.category || workCategories[0],
      platform: work.platform || platforms[0],
      format: work.format || videoFormats[0],
      thumbnail_url: work.thumbnail_url,
      video_url: work.video_url,
      featured_on_homepage: work.featured_on_homepage,
      homepage_sort_order: work.homepage_sort_order,
      sort_order: work.sort_order,
      is_published: work.is_published
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-zinc-950">
          {editingId ? (isZh ? "编辑官方作品" : "Edit showcase work") : isZh ? "上传官方作品" : "Upload showcase work"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label={isZh ? "标题" : "Title"}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label={isZh ? "品类" : "Category"}>
            <select
              className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {workCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label={isZh ? "平台" : "Platform"}>
            <select
              className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
            >
              {platforms.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label={isZh ? "画幅" : "Format"}>
            <select
              className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
            >
              {videoFormats.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label={isZh ? "封面图 URL" : "Thumbnail URL"} className="sm:col-span-2">
            <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
          </Field>
          <Field label={isZh ? "视频 URL" : "Video URL"} className="sm:col-span-2">
            <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
          </Field>
          <Field label={isZh ? "上传视频" : "Upload video"} className="sm:col-span-2">
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadVideo(file);
              }}
            />
          </Field>
          <Field label={isZh ? "简介" : "Description"} className="sm:col-span-2">
            <textarea
              className="min-h-24 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured_on_homepage}
              onChange={(e) => setForm({ ...form, featured_on_homepage: e.target.checked })}
            />
            {isZh ? "首页精选" : "Homepage featured"}
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            {isZh ? "已发布" : "Published"}
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" disabled={saving || !form.title.trim() || !form.video_url.trim()} onClick={() => void saveWork()}>
            {saving ? (isZh ? "保存中…" : "Saving…") : isZh ? "保存" : "Save"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              {isZh ? "取消编辑" : "Cancel edit"}
            </Button>
          ) : null}
        </div>
        {message ? <p className="mt-3 text-sm text-zinc-600">{message}</p> : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-zinc-950">{isZh ? "作品列表" : "Showcase list"}</h2>
        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">{isZh ? "加载中…" : "Loading…"}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {works.map((work) => (
              <div key={work.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-100 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-950">{work.title}</p>
                  <p className="text-xs text-zinc-500">
                    {work.category} · {work.platform}
                    {work.featured_on_homepage ? (isZh ? " · 首页精选" : " · Homepage") : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => startEdit(work)}>
                    {isZh ? "编辑" : "Edit"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void removeWork(work.id)}>
                    {isZh ? "删除" : "Delete"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}
