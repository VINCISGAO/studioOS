"use client";

import type { ComponentType, ReactNode, ButtonHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function KnowledgeEditorCard({
  title,
  children,
  className
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-zinc-200 bg-white shadow-sm", className)}>
      {title ? (
        <header className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        </header>
      ) : null}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function KnowledgeEditorFieldLabel({
  label,
  required,
  counter
}: {
  label: string;
  required?: boolean;
  counter?: string;
}) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
      <label className="text-sm font-medium text-zinc-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {counter ? <span className="shrink-0 text-xs text-zinc-400">{counter}</span> : null}
    </div>
  );
}

export function KnowledgeEditorIconSelect({
  icon: Icon,
  children,
  className,
  ...props
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("flex h-11 w-full min-w-0 items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3", className)}>
      <Icon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
      <select
        {...props}
        className="min-w-0 flex-1 appearance-none truncate border-0 bg-transparent py-2 pr-1 text-sm text-zinc-800 outline-none"
      >
        {children}
      </select>
    </div>
  );
}

export function KnowledgeEditorIconButton({
  icon: Icon,
  children,
  className,
  ...props
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex h-11 w-full min-w-0 items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-700 transition hover:bg-zinc-50",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}
