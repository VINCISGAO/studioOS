import { getAppUiLocale } from "@/lib/app-language";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BrandSettingsHub } from "@/components/studioos/brand-settings-hub";
import { requireBrandPortalClientEmail } from "@/features/auth/session-context";
import { getOrCreateBrandProfile } from "@/lib/brand-profile-service";
import { DEMO_USERS } from "@/lib/demo-auth";
import { type SearchParams, withLocale } from "@/lib/i18n";
import { getBrandSettingsViewModel } from "@/lib/studioos/brand-settings-service";

export default async function BrandSettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  void searchParams;

  let email: string;
  try {
    email = await requireBrandPortalClientEmail();
  } catch {
    redirect(withLocale("/login?role=brand", locale));
  }

  const demo = DEMO_USERS.find((user) => user.email === email);
  const companyName = demo?.label.replace(/\s*\(brand\)/i, "").trim() ?? email.split("@")[0] ?? "Brand";
  await getOrCreateBrandProfile({ client_email: email, company_name: companyName });

  const settings = await getBrandSettingsViewModel(email, email);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />}>
      <BrandSettingsHub locale={locale} settings={settings} />
    </Suspense>
  );
}
