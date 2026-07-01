"use client";

import type { ConfirmedBriefField } from "@/lib/studioos/confirmed-brief";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const copy = {
  en: {
    formTitle: "Confirm requirement form",
    formSubtitle: "Review every field — creators receive this exact form after you publish.",
    docTitle: "Campaign requirement form",
    accuracyTitle: "Accuracy certification",
    certify: "I confirm this information is accurate and ready to share with creators",
    tipTitle: "Friendly tip",
    tipBody: 'After publishing, track progress and messages under "My ads".'
  },
  zh: {
    formTitle: "确认需求表单",
    formSubtitle: "请仔细核对以下信息。确认发布后，创作者将收到与此完全一致的正式需求表单。",
    docTitle: "广告需求确认表",
    accuracyTitle: "信息准确性确认",
    certify: "我确认以上信息准确无误，同意发送给创作者",
    tipTitle: "温馨提示",
    tipBody: "发布后您仍可在「我的需求」中查看进度与沟通记录。"
  }
} as const;

function groupFields(fields: ConfirmedBriefField[]) {
  const groups: Array<{ section: string; items: ConfirmedBriefField[] }> = [];
  for (const field of fields) {
    const last = groups[groups.length - 1];
    if (!last || last.section !== field.section) {
      groups.push({ section: field.section, items: [field] });
    } else {
      last.items.push(field);
    }
  }
  return groups;
}

const reviewSectionKeys = new Set(["基本信息", "Basic information", "交付规格", "Deliverables"]);

export function BrandCampaignStep2FormPanel({
  locale,
  projectTitle,
  fields,
  certified,
  onCertifiedChange
}: {
  locale: Locale;
  projectTitle: string;
  fields: ConfirmedBriefField[];
  certified: boolean;
  onCertifiedChange: (value: boolean) => void;
}) {
  const t = copy[locale];
  const sections = groupFields(fields).filter((section) => reviewSectionKeys.has(section.section));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950">{t.formTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.formSubtitle}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="border-b border-zinc-100 bg-zinc-50/80 px-5 py-4 sm:px-6">
            <p className="text-xs font-medium text-zinc-500">{t.docTitle}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-950">{projectTitle}</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {sections.map((section) => (
              <div key={section.section} className="px-5 py-5 sm:px-6">
                <h3 className="text-sm font-semibold text-zinc-900">{section.section}</h3>
                <dl className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={`${item.section}-${item.label}`}
                      className="grid gap-1 border-b border-zinc-50 pb-3 last:border-0 last:pb-0 sm:grid-cols-[minmax(7rem,34%)_1fr] sm:gap-4"
                    >
                      <dt className="text-sm text-zinc-500">{item.label}</dt>
                      <dd className="whitespace-pre-wrap text-sm font-medium leading-6 text-zinc-900">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm font-semibold text-amber-950">{t.accuracyTitle}</p>
          </div>
          <label
            className={cn(
              "mt-4 flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-4 transition",
              certified ? "border-violet-600 ring-2 ring-violet-100" : "border-amber-200"
            )}
          >
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => onCertifiedChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-600"
            />
            <span className="text-sm leading-6 text-zinc-700">{t.certify}</span>
          </label>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
            <div>
              <p className="text-sm font-semibold text-zinc-950">{t.tipTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{t.tipBody}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
