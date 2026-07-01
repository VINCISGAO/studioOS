import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandAttributionHub } from "@/components/studioos/brand-attribution-hub";
import { getCurrentClientEmail } from "@/lib/client-session";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { getBrandAttributionWorkspace } from "@/lib/studioos/attribution-service";

export default async function BrandAttributionPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = getLocale(await searchParams);
  const clientEmail = await getCurrentClientEmail();

  if (!clientEmail) {
    redirect(withLocale("/login?role=brand", locale));
  }

  const workspace = await getBrandAttributionWorkspace(clientEmail);

  return (
    <div>
      <Link
        href={withLocale("/brand", locale)}
        className="inline-flex items-center text-sm text-zinc-500 transition hover:text-zinc-900"
      >
        ← {locale === "zh" ? "返回工作台" : "Back to workspace"}
      </Link>
      <div className="mt-6">
        <BrandAttributionHub
          locale={locale}
          rows={workspace.rows}
          insights={workspace.insights}
          pendingCount={workspace.pendingCount}
          attributedCount={workspace.attributedCount}
        />
      </div>
    </div>
  );
}
