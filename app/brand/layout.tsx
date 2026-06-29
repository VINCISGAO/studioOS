import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BrandReviewShell } from "@/components/mvp/brand-review-shell";
import { BrandPortalShell } from "@/components/studioos/brand-portal-shell";
import { getLocale, withLocale } from "@/lib/i18n";
import { getMvpProfile } from "@/lib/mvp/session";

type BrandLayoutProps = {
  children: React.ReactNode;
};

export default async function BrandLayout({ children }: BrandLayoutProps) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/brand";
  const search = headerList.get("x-search") ?? "";
  const locale = getLocale({ lang: new URLSearchParams(search).get("lang") ?? undefined });

  const isReviewRoom =
    /\/brand\/projects\/[^/]+\/review/.test(pathname) || /\/brand\/orders\/[^/]+\/review/.test(pathname);

  if (isReviewRoom) {
    const profile = await getMvpProfile();
    if (!profile || (profile.role !== "brand" && profile.role !== "admin")) {
      redirect(withLocale("/login?role=brand", locale));
    }

    return (
      <BrandReviewShell locale={locale} pathname={pathname} search={search} profile={profile} reviewMode>
        {children}
      </BrandReviewShell>
    );
  }

  return (
    <BrandPortalShell locale={locale} pathname={pathname} search={search}>
      {children}
    </BrandPortalShell>
  );
}
