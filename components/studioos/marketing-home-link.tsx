"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MarketingHomeLink({
  locale,
  className,
  children
}: {
  locale: Locale;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={withLocale("/", locale)} className={cn(className)}>
      {children}
    </Link>
  );
}
