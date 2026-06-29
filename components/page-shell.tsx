import { SiteHeader } from "@/components/site-header";
import type { Locale } from "@/lib/i18n";

export async function PageShell({
  children,
  locale = "en"
}: {
  children: React.ReactNode;
  locale?: Locale;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader locale={locale} />
      {children}
    </div>
  );
}
