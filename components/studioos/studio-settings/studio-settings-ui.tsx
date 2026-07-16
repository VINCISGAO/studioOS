"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Lock, Smartphone } from "lucide-react";

export function SecurityCard({
  title,
  subtitle,
  icon,
  iconTone,
  badge,
  children,
  className,
  bodyClassName
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  iconTone: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconTone)}>
            {icon}
          </span>
          <div>
            <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p> : null}
          </div>
        </div>
        {badge}
      </div>
      <div className={cn("flex flex-1 flex-col p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

export function SettingsToggle({
  checked,
  disabled,
  onCheckedChange,
  label
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50",
        checked ? "bg-violet-600" : "bg-zinc-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function TwoFactorIllustration() {
  return (
    <div className="relative mx-auto flex h-36 w-full max-w-[220px] items-center justify-center">
      <div className="absolute inset-x-6 top-3 h-24 rounded-[28px] bg-sky-50/90" />
      <div className="absolute left-8 top-8 h-9 w-9 rounded-xl bg-white shadow-sm ring-1 ring-sky-100" />
      <div className="absolute right-8 top-10 h-8 w-8 rounded-lg bg-white shadow-sm ring-1 ring-sky-100" />
      <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-sky-500 text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)]">
        <Lock className="h-9 w-9" strokeWidth={1.8} />
      </div>
      <Smartphone className="absolute bottom-2 right-10 h-11 w-11 text-sky-300/90" strokeWidth={1.5} />
    </div>
  );
}

export function OAuthBrandMark({ provider }: { provider: "google" | "apple" | "facebook" }) {
  if (provider === "google") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-zinc-100">
        <span className="text-sm font-bold text-[#4285F4]">G</span>
      </span>
    );
  }
  if (provider === "apple") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-zinc-100">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-zinc-900" aria-hidden>
          <path d="M16.365 1.43c0 1.14-.467 2.226-1.257 3.01-.79.785-1.884 1.22-3.008 1.203-.04-1.117.45-2.18 1.23-2.95.78-.77 1.865-1.203 3.035-1.263zm3.05 16.68c-.745 1.72-1.65 3.3-2.715 4.74-1.065 1.44-2.03 2.88-2.895 4.32-.865 1.44-1.64 2.16-2.325 2.16-.685 0-1.37-.24-2.055-.72-.685-.48-1.315-.72-1.89-.72-.575 0-1.23.24-1.965.72-.735.48-1.425.72-2.07.72-.6 0-1.35-.705-2.25-2.115-.9-1.41-1.785-2.955-2.655-4.635-.87-1.68-1.305-3.33-1.305-4.95 0-1.62.585-2.985 1.755-4.095 1.17-1.11 2.58-1.665 4.23-1.665.84 0 1.545.165 2.115.495.57.33 1.05.495 1.44.495.36 0 .885-.18 1.575-.54.765-.405 1.59-.615 2.475-.63 1.92.03 3.375.885 4.365 2.565-1.71.975-2.565 2.34-2.565 4.095 0 1.59.735 2.925 2.205 4.005z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-zinc-100">
      <span className="text-sm font-bold text-[#1877F2]">f</span>
    </span>
  );
}
