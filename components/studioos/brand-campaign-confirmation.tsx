"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useAcknowledgeAlert } from "@/components/studioos/acknowledge-alert-provider";
import { confirmBrandCampaignAction } from "@/app/brand-campaign-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import type { StoredProject } from "@/lib/project-types";
import {
  buildConfirmedBriefSnapshot,
  type ConfirmedBriefField
} from "@/lib/studioos/confirmed-brief";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Pencil } from "lucide-react";

const copy = {
  en: {
    step: "Step 2 / 3",
    title: "Review and confirm your brief",
    subtitle: "Please review every field carefully — creators receive this exact form after you publish.",
    docTitle: "Campaign requirement form",
    docId: "Form ID",
    accuracyTitle: "Accuracy certification",
    accuracyBody:
      "By confirming, you certify that the information above is complete and accurate. Creators will use this as the official production brief.",
    certify: "I confirm this information is accurate and ready to share with creators",
    confirm: "Confirm and continue",
    edit: "Edit responses",
    sectionFallback: "Details"
  },
  zh: {
    step: "第 2 步 / 共 3 步",
    title: "确认需求表单",
    subtitle: "请仔细核对以下信息。确认发布后，创作者将收到与此完全一致的正式需求表单。",
    docTitle: "广告需求确认表",
    docId: "表单编号",
    accuracyTitle: "信息准确性确认",
    accuracyBody: "确认即表示您保证以上信息完整、准确。创作者将以此作为正式制作依据。",
    certify: "我确认以上信息准确无误，同意发送给创作者",
    confirm: "确认并继续",
    edit: "返回修改",
    sectionFallback: "详情"
  }
};

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

export function BrandCampaignConfirmation({
  locale,
  project,
  onConfirmed
}: {
  locale: Locale;
  project: StoredProject;
  onConfirmed: () => void;
}) {
  const t = copy[locale];
  const { alert } = useAcknowledgeAlert();
  const [certified, setCertified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (error) alert(error);
  }, [alert, error]);

  const snapshot = useMemo(() => buildConfirmedBriefSnapshot(project, locale), [project, locale]);
  const sections = useMemo(() => groupFields(snapshot.fields), [snapshot.fields]);

  function handleConfirm() {
    if (!certified) {
      alert(locale === "zh" ? "请先勾选确认项" : "Please check the certification box");
      return;
    }

    startTransition(async () => {
      setError(null);
      const fd = new FormData();
      fd.set("lang", locale);
      fd.set("project_id", project.id);
      fd.set("confirmed", "1");
      const result = await confirmBrandCampaignAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onConfirmed();
    });
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{t.step}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{t.subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{t.docTitle}</p>
              <p className="mt-1 text-lg font-semibold text-zinc-950">{project.title || project.product_name}</p>
            </div>
            <div className="text-right text-xs text-zinc-500">
              <p>{t.docId}</p>
              <p className="mt-0.5 font-mono text-zinc-700">{project.id.slice(-10).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-zinc-100">
          {sections.map((section) => (
            <div key={section.section} className="px-5 py-5 sm:px-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{section.section}</h2>
              <dl className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <div
                    key={`${item.section}-${item.label}`}
                    className="grid gap-1 border-b border-zinc-50 pb-3 last:border-0 last:pb-0 sm:grid-cols-[minmax(7rem,34%)_1fr] sm:gap-4"
                  >
                    <dt className="text-sm font-medium text-zinc-600">{item.label}</dt>
                    <dd className="whitespace-pre-wrap text-sm leading-6 text-zinc-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-4 sm:px-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-950">{t.accuracyTitle}</p>
            <p className="mt-1 text-sm leading-6 text-amber-900/80">{t.accuracyBody}</p>
          </div>
        </div>
      </div>

      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 transition sm:items-center",
          certified ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"
        )}
      >
        <input
          type="checkbox"
          checked={certified}
          onChange={(e) => {
            setCertified(e.target.checked);
            if (e.target.checked) setError(null);
          }}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/20 sm:mt-0"
        />
        <span className="text-sm leading-6 text-zinc-700">{t.certify}</span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild type="button" variant="outline" className="rounded-full">
          <Link href={withLocale(`/brand/projects/new?project=${project.id}&step=1`, locale)}>
            <Pencil className="h-4 w-4" /> {t.edit}
          </Link>
        </Button>
        <Button
          type="button"
          className="h-12 rounded-full px-6 sm:min-w-[220px]"
          disabled={isPending || !certified}
          onClick={handleConfirm}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {t.confirm}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
