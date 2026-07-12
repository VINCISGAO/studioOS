"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { marketingHomeHref } from "@/lib/marketing/localized-href";
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
    <Link href={marketingHomeHref.home(locale)} prefetch={false} className={cn(className)}>
      {children}
    </Link>
  );
}
