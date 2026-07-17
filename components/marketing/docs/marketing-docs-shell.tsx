import type { ReactNode } from "react";
import type { MarketingDocsNavKey } from "@/lib/marketing/marketing-docs-nav";
import type { MarketingLocale } from "@/lib/i18n";

/**
 * @deprecated Layout provides docs chrome via MarketingDocsLayoutShell.
 * Passthrough for legacy imports; locale/active are ignored.
 */
export function MarketingDocsShell({
  children,
  locale: _locale,
  active: _active
}: {
  children: ReactNode;
  locale?: MarketingLocale;
  active?: MarketingDocsNavKey;
}) {
  return <>{children}</>;
}
