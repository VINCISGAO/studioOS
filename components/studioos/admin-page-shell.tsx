import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { adminChrome } from "@/lib/studioos/admin-copy";
import { PORTAL_CONTENT_MAX } from "@/lib/studioos/portal-layout-tokens";
import { cn } from "@/lib/utils";

export function AdminPageShell({
  locale,
  title,
  subtitle,
  actions,
  className,
  children
}: {
  locale: Locale;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const chrome = adminChrome(locale);

  return (
    <div className={cn(PORTAL_CONTENT_MAX.default, "mx-auto w-full", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">{chrome.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function AdminPageActionLink({
  href,
  children,
  variant = "outline"
}: {
  href: string;
  children: React.ReactNode;
  variant?: "outline" | "primary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition",
        variant === "primary"
          ? "bg-violet-600 text-white hover:bg-violet-700"
          : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
      )}
    >
      {children}
    </Link>
  );
}
