import Link from "next/link";
import { PortalNotFoundPanel } from "@/components/studioos/portal-not-found-panel";
import { getAppUiLocale } from "@/lib/app-language";
import { withLocale } from "@/lib/i18n";

export default async function RootNotFound() {
  const locale = await getAppUiLocale();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <PortalNotFoundPanel locale={locale} backHref={withLocale("/", locale)} />
      <Link
        href={withLocale("/", locale)}
        className="mt-6 text-sm text-zinc-500 transition hover:text-zinc-800"
      >
        {locale === "zh" ? "返回首页" : "Back to home"}
      </Link>
    </div>
  );
}
