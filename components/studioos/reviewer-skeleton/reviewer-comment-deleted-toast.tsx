"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewerCommentDeletedToast({
  message,
  className
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-800 shadow-sm",
        className
      )}
    >
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      {message}
    </div>
  );
}

export function ReviewerReviewSuccessToast({
  message,
  description,
  variant = "success",
  className
}: {
  message: string;
  description: string;
  variant?: "success" | "warning";
  className?: string;
}) {
  const isWarning = variant === "warning";
  const Icon = isWarning ? AlertCircle : CheckCircle2;
  return (
    <div
      role="status"
      className={cn(
        "relative inline-flex min-h-[72px] items-center overflow-hidden rounded-2xl bg-white px-5 py-3 text-left shadow-[0_14px_32px_rgba(15,23,42,0.11)]",
        isWarning ? "border border-amber-100" : "border border-emerald-100",
        isWarning
          ? "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-amber-400"
          : "before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-emerald-400",
        className
      )}
    >
      <div className="relative z-10 flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <span className={cn("absolute inset-1 rounded-full blur-md", isWarning ? "bg-amber-100" : "bg-emerald-100")} />
          <span
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-full text-white ring-4",
              isWarning
                ? "bg-amber-400 shadow-[0_8px_18px_rgba(245,158,11,0.24)] ring-amber-50"
                : "bg-emerald-400 shadow-[0_8px_18px_rgba(16,185,129,0.25)] ring-emerald-50"
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2.6} />
          </span>
        </div>
        <div className="h-9 w-px shrink-0 bg-zinc-200" />
        <div className="min-w-0">
          <p className="whitespace-nowrap text-sm font-semibold tracking-tight text-zinc-900">{message}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
