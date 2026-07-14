"use client";

import {
  KNOWLEDGE_PUBLISH_STATUSES,
  KNOWLEDGE_VISIBILITY_OPTIONS
} from "@/lib/knowledge/knowledge-editor.constants";
import { KNOWLEDGE_PUBLISH_STATUS_LABELS_ZH, KNOWLEDGE_VISIBILITY_LABELS_ZH } from "@/lib/knowledge/knowledge-editor-copy";
import type { KnowledgeVisibility } from "@/lib/knowledge/knowledge-editor-validation";
import type { KnowledgeArticleStatus } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { Input } from "@/components/ui/input";

export function KnowledgeEditorPublishCard({
  locale,
  status,
  visibility,
  scheduledDate,
  scheduledTime,
  timezone,
  onChange
}: {
  locale: Locale;
  status: KnowledgeArticleStatus;
  visibility: KnowledgeVisibility;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  onChange: (patch: {
    status?: KnowledgeArticleStatus;
    visibility?: KnowledgeVisibility;
    scheduledDate?: string;
    scheduledTime?: string;
    timezone?: string;
  }) => void;
}) {
  const zh = locale === "zh";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">{zh ? "发布" : "Publish"}</h3>
      <div className="mt-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-zinc-600">{zh ? "状态" : "Status"}</label>
          <select
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
            value={status}
            onChange={(event) => onChange({ status: event.target.value as KnowledgeArticleStatus })}
          >
            {KNOWLEDGE_PUBLISH_STATUSES.map((item) => (
              <option key={item} value={item}>
                {zh ? KNOWLEDGE_PUBLISH_STATUS_LABELS_ZH[item] : item}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-zinc-600">{zh ? "日期" : "Date"}</label>
            <Input type="date" className="mt-1" value={scheduledDate} onChange={(event) => onChange({ scheduledDate: event.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">{zh ? "时间" : "Time"}</label>
            <Input type="time" className="mt-1" value={scheduledTime} onChange={(event) => onChange({ scheduledTime: event.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">{zh ? "时区" : "Timezone"}</label>
          <Input className="mt-1" value={timezone} onChange={(event) => onChange({ timezone: event.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">{zh ? "可见性" : "Visibility"}</label>
          <select
            className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
            value={visibility}
            onChange={(event) => onChange({ visibility: event.target.value as KnowledgeVisibility })}
          >
            {KNOWLEDGE_VISIBILITY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {zh ? KNOWLEDGE_VISIBILITY_LABELS_ZH[item] : item}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
