"use client";

import type { KnowledgeEditorPanelForm } from "@/lib/knowledge/knowledge-editor-initial-form";
import { knowledgeHtmlIsEmpty } from "@/lib/knowledge/knowledge-html";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

type Props = {
  locale: Locale;
  open: boolean;
  form: KnowledgeEditorPanelForm;
  blockers: string[];
  warnings: string[];
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function KnowledgeEditorPublishDialog({
  locale,
  open,
  form,
  blockers,
  warnings,
  saving,
  onClose,
  onConfirm
}: Props) {
  const zh = locale === "zh";
  if (!open || typeof document === "undefined") return null;

  const scheduledAt =
    form.scheduledDate && form.scheduledTime ? new Date(`${form.scheduledDate}T${form.scheduledTime}`) : null;
  const willSchedule = Boolean(scheduledAt && scheduledAt.getTime() > Date.now());
  const canConfirm = blockers.length === 0 && !saving;

  const checks = [
    { label: zh ? "标题" : "Title", ok: Boolean(form.title.trim()) },
    { label: zh ? "正文" : "Body", ok: !knowledgeHtmlIsEmpty(form.body_html) },
    { label: zh ? "分类" : "Category", ok: Boolean(form.category_slug.trim()) },
    { label: zh ? "副标题 / 摘要" : "Subtitle / excerpt", ok: Boolean(form.subtitle.trim()), warn: true },
    { label: zh ? "封面" : "Cover", ok: Boolean(form.cover_image_url.trim()), warn: true }
  ];

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/45 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-950">{zh ? "发布前检查" : "Pre-publish checks"}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {willSchedule
              ? zh
                ? `已设置定时发布：${form.scheduledDate} ${form.scheduledTime}（不会立即上线）`
                : `Scheduled for ${form.scheduledDate} ${form.scheduledTime} (not live immediately)`
              : zh
                ? "确认内容、SEO 与元数据后再发布。"
                : "Review content, SEO, and metadata before publishing."}
          </p>
        </div>
        <ul className="max-h-[50vh] space-y-2 overflow-auto px-5 py-4 text-sm">
          {checks.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2">
              <span className="text-zinc-700">{item.label}</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  item.ok ? "text-emerald-600" : item.warn ? "text-amber-600" : "text-rose-600"
                )}
              >
                {item.ok ? (zh ? "通过" : "OK") : item.warn ? (zh ? "建议补充" : "Recommended") : zh ? "缺失" : "Missing"}
              </span>
            </li>
          ))}
        </ul>
        {blockers.length ? (
          <div className="mx-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <p className="font-medium">{zh ? "必须修复" : "Must fix"}</p>
            <ul className="mt-1 list-disc pl-5">
              {blockers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {warnings.length ? (
          <div className="mx-5 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-medium">{zh ? "警告" : "Warnings"}</p>
            <ul className="mt-1 list-disc pl-5">
              {warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4">
          <button
            type="button"
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            onClick={onClose}
            disabled={saving}
          >
            {zh ? "取消" : "Cancel"}
          </button>
          <button
            type="button"
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50",
              canConfirm ? "bg-violet-600 hover:bg-violet-700" : "bg-zinc-400"
            )}
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {saving ? (zh ? "发布中…" : "Publishing…") : zh ? "确认发布" : "Confirm publish"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
