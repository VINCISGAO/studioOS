import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrandPortalShell } from "@/components/studioos/brand-portal-shell";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import { getLocale, encodeBrandLoginNext, withLocale } from "@/lib/i18n";
import { countUnreadBrandNotifications } from "@/lib/studioos/brand-notification-service";
import { resolveBrandDisplayName } from "@/lib/studioos/brand-account-display";

type BrandLayoutProps = {
  children: React.ReactNode;
};

export default async function BrandLayout({ children }: BrandLayoutProps) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/brand";
  const search = headerList.get("x-search") ?? "";
  const locale = getLocale({ lang: new URLSearchParams(search).get("lang") ?? undefined });

  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  if (!session || session.role !== "client") {
    const next = encodeBrandLoginNext(pathname, search);
    redirect(withLocale(`/login?role=brand&next=${next}`, locale));
  }

  const unreadMessages = await countUnreadBrandNotifications(session.email);
  const brandName = await resolveBrandDisplayName(session.email);

  return (
    <BrandPortalShell
      locale={locale}
      pathname={pathname}
      search={search}
      unreadMessageCount={unreadMessages}
      brandAccount={{ name: brandName, email: session.email.toLowerCase() }}
    >
      {children}
    </BrandPortalShell>
  );
}
