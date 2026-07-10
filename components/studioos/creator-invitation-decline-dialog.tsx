"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  briefMissingValues,
  declineReasonCopy,
  declineReasonValues,
  type CreatorInvitationDeclineReason
} from "@/features/matching/invitation-decline-feedback";
import type { Locale } from "@/lib/i18n";

const copy = {
  en: {
    title: "Why are you declining?",
    body: "Your feedback is private and helps AI recommend better projects to you.",
    submit: "Submit feedback",
    cancel: "Cancel",
    budget: "What budget would you consider?",
    availability: "When are you available?",
    missing: "What information is missing?",
    category: "What does not match?",
    deadline: "What timing would work?",
    risk: "What risk did you notice?",
    note: "Additional note (optional)"
  },
  zh: {
    title: "为什么拒绝这个项目？",
    body: "你的反馈不会公开给品牌方，仅用于 AI 学习你的偏好，未来减少无效邀请。",
    submit: "提交反馈",
    cancel: "取消",
    budget: "达到什么预算你会考虑？",
    availability: "什么时候有档期？",
    missing: "缺少哪些信息？",
    category: "哪里不符合？",
    deadline: "怎样的交期可以接受？",
    risk: "你注意到什么风险？",
    note: "补充说明（选填）"
  }
} as const;

const optionCopy = {
  budget: ["$300+", "$500+", "$800+", "$1000+", "Custom"],
  availability: {
    en: ["One week later", "Two weeks later", "One month later", "Not sure"],
    zh: ["一周后", "两周后", "一个月后", "不确定"]
  },
  missing: {
    en: ["Product intro", "Reference cases", "Production requirements", "Product assets", "Delivery standard", "Other"],
    zh: ["产品介绍", "参考案例", "制作要求", "产品素材", "交付标准", "其它"]
  },
  category: {
    en: ["Product type", "Platform", "Production method", "Other"],
    zh: ["产品类型不符合", "平台不符合", "制作方式不符合", "其它"]
  },
  deadline: {
    en: ["Extend 2 days", "Extend one week", "Still not possible"],
    zh: ["延长 2 天可以接受", "延长一周可以接受", "无法接受"]
  },
  risk: {
    en: ["Industry risk", "Legal risk", "Content risk", "Prefer not to say"],
    zh: ["行业风险", "法律风险", "内容风险", "不方便透露"]
  }
} as const;

export function CreatorInvitationDeclineDialog({
  locale,
  open,
  pending,
  onOpenChange,
  onSubmit
}: {
  locale: Locale;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
}) {
  const t = copy[locale];
  const [reason, setReason] = useState<CreatorInvitationDeclineReason>("BUDGET_TOO_LOW");
  const [budgetThreshold, setBudgetThreshold] = useState("500");
  const [briefMissing, setBriefMissing] = useState<string[]>([]);
  const requiresCustomBudget = budgetThreshold === "custom";
  const canSubmit = reason !== "BRIEF_INSUFFICIENT" || briefMissing.length > 0;

  const detail = useMemo(() => {
    if (reason === "BUDGET_TOO_LOW") return budgetDetail(t.budget, budgetThreshold, setBudgetThreshold);
    if (reason === "SCHEDULE_CONFLICT") return radioDetail(t.availability, "availability", ["one_week", "two_weeks", "one_month", "unknown"], optionCopy.availability[locale]);
    if (reason === "NOT_MY_CATEGORY") return radioDetail(t.category, "category_mismatch", ["product_type", "platform", "production_method", "other"], optionCopy.category[locale]);
    if (reason === "DEADLINE_TOO_TIGHT") return radioDetail(t.deadline, "deadline_extension", ["two_days", "one_week", "not_possible"], optionCopy.deadline[locale]);
    if (reason === "BRAND_RISK") return radioDetail(t.risk, "brand_risk", ["industry", "legal", "content", "private"], optionCopy.risk[locale]);
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-700">{t.missing}</p>
        <div className="grid gap-2">
          {briefMissingValues.map((value, index) => (
            <label key={value} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={briefMissing.includes(value)}
                onChange={(event) =>
                  setBriefMissing((current) =>
                    event.target.checked ? [...current, value] : current.filter((item) => item !== value)
                  )
                }
              />
              {optionCopy.missing[locale][index]}
            </label>
          ))}
        </div>
      </div>
    );
  }, [budgetThreshold, briefMissing, locale, reason, t]);

  function submit() {
    const formData = new FormData();
    formData.set("decline_reason", reason);
    formData.set("budget_threshold", budgetThreshold);
    setCheckedValue(formData, "availability");
    setCheckedValue(formData, "category_mismatch");
    setCheckedValue(formData, "deadline_extension");
    setCheckedValue(formData, "brand_risk");
    for (const item of briefMissing) formData.append("brief_missing", item);
    const customBudget = document.getElementById("decline-custom-budget") as HTMLInputElement | null;
    const note = document.getElementById("decline-note") as HTMLTextAreaElement | null;
    if (customBudget?.value) formData.set("custom_budget_usd", customBudget.value);
    if (note?.value) formData.set("decline_note", note.value);
    onSubmit(formData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.body}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            {declineReasonValues.map((value) => (
              <button
                key={value}
                type="button"
                className={`rounded-xl border px-3 py-2 text-left text-sm ${reason === value ? "border-violet-300 bg-violet-50 text-violet-800" : "border-zinc-200 text-zinc-700"}`}
                onClick={() => setReason(value)}
              >
                {declineReasonCopy[locale][value]}
              </button>
            ))}
          </div>
          {detail}
          {requiresCustomBudget ? (
            <input id="decline-custom-budget" type="number" min="1" className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm" placeholder="USD" />
          ) : null}
          <textarea id="decline-note" className="min-h-20 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm" placeholder={t.note} />
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:space-x-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
            {t.cancel}
          </Button>
          <Button type="button" disabled={pending || !canSubmit} onClick={submit}>
            {t.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function setCheckedValue(formData: FormData, name: string) {
  const checked = document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
  if (checked?.value) formData.set(name, checked.value);
}

function budgetDetail(label: string, value: string, onChange: (value: string) => void) {
  return radioButtons(label, "budget_threshold", ["300", "500", "800", "1000", "custom"], optionCopy.budget, value, onChange);
}

function radioDetail(label: string, name: string, values: readonly string[], labels: readonly string[]) {
  return radioButtons(label, name, values, labels);
}

function radioButtons(label: string, name: string, values: readonly string[], labels: readonly string[], value?: string, onChange?: (value: string) => void) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-700">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {values.map((item, index) => (
          <label key={item} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700">
            <input name={name} type="radio" value={item} defaultChecked={index === 0} checked={value ? value === item : undefined} onChange={() => onChange?.(item)} />
            {labels[index]}
          </label>
        ))}
      </div>
    </div>
  );
}
