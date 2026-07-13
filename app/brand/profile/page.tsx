import { getAppUiLocale } from "@/lib/app-language";
import { redirect } from "next/navigation";
import { BrandProfileEditor } from "@/components/studioos/brand-profile-editor";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { DEMO_USERS } from "@/lib/demo-auth";
import {
  getBrandProfileByEmail,
  getOrCreateBrandProfile,
  syncBrandShowcaseFromOrders
} from "@/lib/brand-profile-service";
import { type SearchParams, withLocale } from "@/lib/i18n";

export default async function BrandProfilePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();
  const email = await getCurrentClientEmail();
  if (!email) {
    redirect(withLocale("/login?role=brand", locale));
  }

  const demo = DEMO_USERS.find((user) => user.email === email.toLowerCase());
  const fallbackCompanyName =
    demo?.label.replace(/\s*\(brand\)/i, "").trim() ?? email.split("@")[0] ?? "Brand";

  const existingProfile = await getBrandProfileByEmail(email);
  if (!existingProfile) {
    await getOrCreateBrandProfile({ client_email: email, company_name: fallbackCompanyName });
  }
  const profile = await syncBrandShowcaseFromOrders(email);

  return <BrandProfileEditor locale={locale} profile={profile} />;
}
