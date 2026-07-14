import { PublicLayout } from "@/components/layouts/public-layout";
import type { Locale } from "@/lib/i18n";

/**
 * @deprecated Prefer route group `(public)` + `PublicLayout`.
 * For legacy pages still on PageShell, this delegates to PublicLayout.
 */
export async function PageShell({
  children,
  locale = "en",
  showHeader = true
}: {
  children: React.ReactNode;
  locale?: Locale;
  showHeader?: boolean;
}) {
  return (
    <PublicLayout locale={locale} showHeader={showHeader}>
      {children}
    </PublicLayout>
  );
}
