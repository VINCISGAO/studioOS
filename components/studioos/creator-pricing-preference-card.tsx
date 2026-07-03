"use client";

import { useState } from "react";
import { CircleDollarSign } from "lucide-react";
import { updatePricingPreferenceAction } from "@/app/studio-settings-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { CreatorSettingsViewModel } from "@/lib/studioos/creator-settings-types";

const copy = {
  en: {
    title: "AI matching budget preference",
    body: "Set your minimum and ideal project budgets. AI will use this to reduce low-fit invitations.",
    min: "Minimum budget",
    ideal: "Ideal budget",
    save: "Save budget preference",
    saved: "Saved.",
    error: "Could not save."
  },
  zh: {
    title: "AI 匹配预算偏好",
    body: "设置你的最低接单预算和理想预算，AI 将据此减少不符合预期的邀请。",
    min: "最低接受预算",
    ideal: "理想预算",
    save: "保存预算偏好",
    saved: "已保存。",
    error: "保存失败。"
  }
} as const;

export function CreatorPricingPreferenceCard({
  locale,
  settings
}: {
  locale: Locale;
  settings: CreatorSettingsViewModel;
}) {
  const t = copy[locale];
  const [minBudget, setMinBudget] = useState(settings.pricing.min_accept_budget_usd?.toString() ?? "");
  const [idealBudget, setIdealBudget] = useState(settings.pricing.ideal_budget_usd?.toString() ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setMessage(null);
    const result = await updatePricingPreferenceAction({
      lang: locale,
      minAcceptBudgetUsd: parseBudgetInput(minBudget),
      idealBudgetUsd: parseBudgetInput(idealBudget)
    });
    setPending(false);
    setMessage(result.ok ? t.saved : result.error ?? t.error);
  }

  return (
    <section className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <CircleDollarSign className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-zinc-950">{t.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">{t.body}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          {t.min}
          <input
            type="number"
            min="1"
            value={minBudget}
            onChange={(event) => setMinBudget(event.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm font-normal"
            placeholder="800"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          {t.ideal}
          <input
            type="number"
            min="1"
            value={idealBudget}
            onChange={(event) => setIdealBudget(event.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm font-normal"
            placeholder="1200"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" disabled={pending} onClick={save} className="rounded-xl bg-violet-600 hover:bg-violet-700">
          {t.save}
        </Button>
        {message ? <p className="text-sm text-zinc-500">{message}</p> : null}
      </div>
    </section>
  );
}

function parseBudgetInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
