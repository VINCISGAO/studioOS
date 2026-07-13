"use client";

import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BriefPurpleChip({
  active,
  disabled,
  onClick,
  children,
  className
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center border px-3 py-2.5 text-sm font-medium transition",
        "rounded-xl",
        active
          ? "border-violet-500 bg-violet-50 text-violet-700"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

export function BriefSectionCard({
  number,
  title,
  subtitle,
  optional,
  locale,
  children,
  id
}: {
  number: number;
  title: string;
  subtitle?: string;
  optional?: boolean;
  locale: Locale;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
            {number}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
              {optional ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                  {locale === "zh" ? "选填" : "Optional"}
                </span>
              ) : null}
            </div>
            {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="space-y-5 p-5 sm:p-6 lg:p-8">{children}</div>
    </section>
  );
}

export function BriefFieldLabel({
  label,
  required,
  hint
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-zinc-900">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </p>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function BriefCharCount({ current, max }: { current: number; max: number }) {
  return (
    <p className="text-right text-xs text-zinc-400">
      {current} / {max}
    </p>
  );
}
