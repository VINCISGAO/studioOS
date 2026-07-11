import { headers } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { AiCopilotRoot } from "@/components/ai-copilot/ai-copilot-root";
import { BrandPortalShell } from "@/components/studioos/brand-portal-shell";
import { getAppUiLocale } from "@/lib/app-language";
import { requireBrandPortalClientEmail } from "@/features/auth/session-context";
import { withLocale } from "@/lib/i18n";
import { getBrandPortalProfile, getBrandPortalUnreadCount } from "@/lib/studioos/brand-portal-data";
import { fallbackBrandDisplayName } from "@/lib/studioos/brand-account-display";
import { brandAvatarObjectKey } from "@/lib/studioos/brand-avatar-upload";
import { enforceBrandPaymentDeadlinesForClient } from "@/lib/studioos/brand-payment-expiry.service";
import { getObjectMetadata } from "@/lib/studioos/object-storage";

type BrandLayoutProps = {
  children: React.ReactNode;
};

function parseBrandAssetUrl(url: string) {
  const match = /^\/api\/brand-assets\/([^/?#]+)\/([^?#]+)(?:[?#].*)?$/.exec(url);
  if (!match) return null;
  try {
    return {
      brandId: decodeURIComponent(match[1]).replace(/[/\\]/g, ""),
      fileName: decodeURIComponent(match[2]).replace(/[/\\]/g, "")
    };
  } catch {
    return null;
  }
}

async function resolveExistingBrandAvatarUrl(rawUrl: string | undefined) {
  const url = rawUrl?.trim();
  if (!url) return undefined;

  const asset = parseBrandAssetUrl(url);
  if (!asset) return url;

  const metadata = await getObjectMetadata(brandAvatarObjectKey(asset.brandId, asset.fileName));
  return metadata ? url : undefined;
}

export default async function BrandLayout({ children }: BrandLayoutProps) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/brand";
  const search = headerList.get("x-search") ?? "";
  const locale = await getAppUiLocale();

  let brandEmail: string;
  try {
    brandEmail = await requireBrandPortalClientEmail();
  } catch {
    redirect(withLocale("/login?role=brand", locale));
  }

  after(() => {
    void enforceBrandPaymentDeadlinesForClient(brandEmail);
  });

  const [unreadMessages, profile] = await Promise.all([
    getBrandPortalUnreadCount(brandEmail),
    getBrandPortalProfile(brandEmail)
  ]);
  const brandName =
    profile?.display_name.trim() || profile?.company_name.trim() || fallbackBrandDisplayName(brandEmail);
  const avatarUrl = profile?.logo_url
    ? await resolveExistingBrandAvatarUrl(profile.logo_url)
    : undefined;

  return (
    <BrandPortalShell
      locale={locale}
      pathname={pathname}
      search={search}
      unreadMessageCount={unreadMessages}
      brandAccount={{ name: brandName, email: brandEmail, avatarUrl }}
    >
      {children}
      <AiCopilotRoot />
    </BrandPortalShell>
  );
}
