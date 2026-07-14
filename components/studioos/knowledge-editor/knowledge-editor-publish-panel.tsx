"use client";

import {
  KnowledgeEditorCard,
  KnowledgeEditorFieldLabel,
  KnowledgeEditorIconSelect
} from "@/components/studioos/knowledge-editor/knowledge-editor-ui-primitives";
import { KNOWLEDGE_VISIBILITY_OPTIONS } from "@/lib/knowledge/knowledge-editor.constants";
import { knowledgeEditorPublishStatusLabel, knowledgeEditorVisibilityLabel } from "@/lib/knowledge/knowledge-editor-copy";
import type { KnowledgeEditorPanelForm } from "@/lib/knowledge/knowledge-editor-initial-form";
import type { KnowledgeArticleStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { Calendar, Globe2 } from "lucide-react";

type Props = {
  locale: Locale;
  form: Pick<KnowledgeEditorPanelForm, "status" | "visibility" | "scheduledDate" | "scheduledTime">;
  onChange: (patch: Partial<Props["form"]>) => void;
};

const STATUS_OPTIONS: KnowledgeArticleStatus[] = ["DRAFT", "REVIEW"];

export function KnowledgeEditorPublishPanel({ locale, form, onChange }: Props) {
  const zh = locale === "zh";
  const scheduleEnabled = Boolean(form.scheduledDate && form.scheduledTime);

  return (
    <KnowledgeEditorCard title={zh ? "发布设置" : "Publish settings"}>
      <div className="space-y-4">
        <div>
          <KnowledgeEditorFieldLabel label={zh ? "工作流状态" : "Workflow status"} />
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onChange({ status })}
                className={
                  form.status === status
                    ? "rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white"
                    : "rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
                }
              >
                {knowledgeEditorPublishStatusLabel(status, zh)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            {zh
              ? "「审核中」仅标记工作流；正式上线请用顶部「发布文章」。保存草稿不会意外发布。"
              : "Review marks workflow only. Use top Publish to go live. Save draft never publishes by itself."}
          </p>
        </div>

        <div className="min-w-0">
          <KnowledgeEditorFieldLabel label={zh ? "可见性" : "Visibility"} />
          <KnowledgeEditorIconSelect
            icon={Globe2}
            value={form.visibility}
            onChange={(event) => onChange({ visibility: event.target.value as Props["form"]["visibility"] })}
          >
            {KNOWLEDGE_VISIBILITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {zh && option === "PUBLIC"
                  ? "公开（所有人可见）"
                  : knowledgeEditorVisibilityLabel(option, zh)}
              </option>
            ))}
          </KnowledgeEditorIconSelect>
        </div>

        <div className="min-w-0">
          <KnowledgeEditorFieldLabel label={zh ? "定时发布" : "Scheduled publish"} />
          {scheduleEnabled ? (
            <div className="grid grid-cols-1 gap-2">
              <input
                type="date"
                value={form.scheduledDate}
                onChange={(event) => onChange({ scheduledDate: event.target.value })}
                className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm"
              />
              <input
                type="time"
                value={form.scheduledTime}
                onChange={(event) => onChange({ scheduledTime: event.target.value })}
                className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm"
              />
              <button
                type="button"
                className="text-left text-xs text-violet-600 hover:underline"
                onClick={() => onChange({ scheduledDate: "", scheduledTime: "" })}
              >
                {zh ? "取消定时，改为立即发布" : "Clear schedule — publish immediately"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex h-11 items-center gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
                <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
                <span>{zh ? "未设置定时（点击发布后立即上线）" : "No schedule (goes live when you publish)"}</span>
              </div>
              <button
                type="button"
                className="text-xs text-violet-600 hover:underline"
                onClick={() => {
                  const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
                  onChange({
                    scheduledDate: future.toISOString().slice(0, 10),
                    scheduledTime: "09:00"
                  });
                }}
              >
                {zh ? "设置定时发布" : "Schedule for later"}
              </button>
            </div>
          )}
        </div>
      </div>
    </KnowledgeEditorCard>
  );
}
