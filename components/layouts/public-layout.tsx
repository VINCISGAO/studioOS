import { Suspense } from "react";
import { PublicHeader } from "@/components/layouts/public-header";
import { PublicLocaleHeader } from "@/components/layouts/public-locale-header";
import { getAppUiLocale } from "@/lib/app-language";
import type { Locale } from "@/lib/i18n";

type PublicLayoutProps = {
  children: React.ReactNode;
  locale?: Locale;
  showHeader?: boolean;
  useUrlLocale?: boolean;
};

function PublicHeaderFallback() {
  return <div className="h-16 border-b bg-background/85 backdrop-blur" aria-hidden />;
}

export async function PublicLayout({
  children,
  locale,
  showHeader = true,
  useUrlLocale = false
}: PublicLayoutProps) {
  const resolvedLocale = locale ?? (await getAppUiLocale());
  return (
    <div className="min-h-dvh bg-background" data-layout="public">
      {showHeader ? (
        useUrlLocale ? (
          <Suspense fallback={<PublicHeaderFallback />}>
            <PublicLocaleHeader />
          </Suspense>
        ) : (
          <PublicHeader locale={resolvedLocale} />
        )
      ) : null}
      {children}
    </div>
  );
}
