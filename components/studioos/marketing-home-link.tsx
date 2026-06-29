import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Full document navigation — avoids client-router issues when dev overlays block clicks. */
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
    <a href={withLocale("/", locale)} className={cn(className)}>
      {children}
    </a>
  );
}
