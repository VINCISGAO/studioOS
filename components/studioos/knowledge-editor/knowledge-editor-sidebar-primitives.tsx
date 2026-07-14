"use client";

import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function KnowledgeEditorSidebarCard({
  title,
  description,
  badge,
  children,
  className,
  tone = "default"
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "default" | "violet" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "violet"
      ? "border-violet-100 bg-violet-50/40"
      : tone === "emerald"
        ? "border-emerald-100 bg-emerald-50/40"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50/70"
          : "border-zinc-200 bg-white";

  return (
    <section className={cn("rounded-2xl border p-5 shadow-sm", toneClass, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          {description ? <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p> : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function KnowledgeEditorFieldStack({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export function KnowledgeEditorField({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-600">{label}</label>
      {children}
      {hint ? <p className="text-[11px] leading-5 text-zinc-400">{hint}</p> : null}
    </div>
  );
}

export function KnowledgeEditorStatusBadge({
  label,
  active,
  locale
}: {
  label: string;
  active: boolean;
  locale: Locale;
}) {
  const zh = locale === "zh";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      )}
    >
      {active ? (zh ? "已同步" : "Synced") : label}
    </span>
  );
}
