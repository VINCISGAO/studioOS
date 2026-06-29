import { redirect } from "next/navigation";
import { BrandProfileEditor } from "@/components/studioos/brand-profile-editor";
import { getCurrentClientEmail } from "@/lib/client-session";
import { DEMO_USERS } from "@/lib/demo-auth";
import {
  getOrCreateBrandProfile,
  syncBrandShowcaseFromOrders
} from "@/lib/brand-profile-service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";

export default async function BrandProfilePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);
  const email = await getCurrentClientEmail();
  if (!email) {
    redirect(withLocale("/login?role=brand", locale));
  }

  const demo = DEMO_USERS.find((user) => user.email === email.toLowerCase());
  const companyName = demo?.label.replace(/\s*\(brand\)/i, "").trim() ?? email.split("@")[0] ?? "Brand";

  await getOrCreateBrandProfile({ client_email: email, company_name: companyName });
  const profile = await syncBrandShowcaseFromOrders(email);

  return <BrandProfileEditor locale={locale} profile={profile} />;
}
