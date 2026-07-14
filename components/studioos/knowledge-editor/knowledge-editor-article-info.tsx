"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useKnowledgeSlugCheck } from "@/hooks/use-knowledge-slug-check";
import { knowledgeEditorSlugValidationMessage } from "@/lib/knowledge/knowledge-editor-copy";
import { validateKnowledgeSlug } from "@/lib/knowledge/knowledge-editor-validation";
import type { Locale } from "@/lib/i18n";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  locale: Locale;
  title: string;
  subtitle: string;
  slug: string;
  slugTouched: boolean;
  excludeArticleId?: string;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
};

export function KnowledgeEditorArticleInfo({
  locale,
  title,
  subtitle,
  slug,
  slugTouched,
  excludeArticleId,
  onTitleChange,
  onSubtitleChange,
  onSlugChange
}: Props) {
  const zh = locale === "zh";
  const slugValidation = validateKnowledgeSlug(slug);
  const slugCheck = useKnowledgeSlugCheck({ slug, excludeArticleId, enabled: slugValidation.ok });
  const previewUrl = slug ? `https://vincis.app/en/resources/${slug}` : "https://vincis.app/en/resources/your-article-slug";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">{zh ? "文章信息" : "Article Information"}</h2>
      <div className="mt-4 space-y-4">
        <Field label={zh ? "标题" : "Title"} required count={`${title.length} / 120`}>
          <Input value={title} onChange={(event) => onTitleChange(event.target.value)} maxLength={120} />
        </Field>
        <Field label={zh ? "URL 别名" : "Slug"} required hint={slugTouched ? undefined : zh ? "根据标题自动生成，可修改" : "Auto-generated from title; editable"}>
          <Input value={slug} onChange={(event) => onSlugChange(event.target.value)} />
          {!slugValidation.ok ? (
            <p className="text-xs text-rose-600">{knowledgeEditorSlugValidationMessage(slugValidation.message, zh)}</p>
          ) : null}
          {slugValidation.ok ? (
            <p
              className={cn(
                "text-xs",
                slugCheck.status === "checking" && "text-zinc-400",
                slugCheck.status === "available" && "text-emerald-600",
                slugCheck.status === "taken" && "text-rose-600",
                slugCheck.status === "invalid" && "text-rose-600"
              )}
            >
              {slugCheck.status === "checking"
                ? zh
                  ? "正在检查 URL 别名…"
                  : "Checking slug…"
                : slugCheck.status === "available"
                  ? zh
                    ? "URL 别名可用"
                    : "Slug is available"
                  : knowledgeEditorSlugValidationMessage(slugCheck.message ?? "", zh)}
            </p>
          ) : null}
        </Field>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          <p className="font-medium text-zinc-700">{zh ? "URL 预览" : "URL Preview"}</p>
          <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[#5B5CEB] hover:underline">
            {previewUrl}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <Field label={zh ? "副标题" : "Subtitle"} count={`${subtitle.length} / 200`}>
          <Textarea rows={3} value={subtitle} onChange={(event) => onSubtitleChange(event.target.value)} maxLength={200} />
        </Field>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  required,
  count,
  hint
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  count?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm text-zinc-700">
          {label}
          {required ? <span className="text-rose-500"> *</span> : null}
        </Label>
        {count ? <span className="text-xs text-zinc-400">{count}</span> : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
