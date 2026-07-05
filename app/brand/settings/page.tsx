import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrandSettingsHub } from "@/components/studioos/brand-settings-hub";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getBrandSettingsViewModel } from "@/lib/studioos/brand-settings-service";

export default async function BrandSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  if (!session || session.role !== "client") {
    redirect(withLocale("/login?role=brand", locale));
  }

  const email = session.email.toLowerCase();
  const settings = await getBrandSettingsViewModel(email, email);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />}>
      <BrandSettingsHub locale={locale} settings={settings} />
    </Suspense>
  );
}
