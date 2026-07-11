import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BrandPublicProfile } from "@/components/studioos/brand-public-profile";
import { brandTheme } from "@/lib/studioos/brand-theme";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { getCurrentClientEmail } from "@/features/auth/session-context";
import { getBrandProfileById } from "@/lib/brand-profile-service";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  en: {
    back: "Back",
    backEdit: "Back to edit",
    notFound: "Brand page not found",
    notFoundHint: "This advertiser page does not exist or has not been published yet."
  },
  zh: {
    back: "返回",
    backEdit: "返回编辑",
    notFound: "未找到品牌主页",
    notFoundHint: "该品牌方主页不存在，或尚未发布。"
  }
};

export default async function BrandPublicPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = getLocale(query);
  const t = copy[locale];
  const profile = await getBrandProfileById(id);
  const clientEmail = await getCurrentClientEmail();
  const isOwner = Boolean(clientEmail && profile?.client_email === clientEmail.toLowerCase());

  if (!profile) {
    notFound();
  }

  if (!profile.profile_completed_at && !isOwner) {
    return (
      <PageShell locale={locale}>
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">{t.notFound}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t.notFoundHint}</p>
          <Button asChild className="mt-6">
            <Link href={withLocale("/", locale)}>{t.back}</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell locale={locale}>
      <main className={cn("min-h-screen", brandTheme.pageBg)}>
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900">
            <Link href={withLocale(isOwner ? "/brand/profile" : "/", locale)}>
              <ArrowLeft className="h-4 w-4" />
              {isOwner ? t.backEdit : t.back}
            </Link>
          </Button>
          <BrandPublicProfile
            locale={locale}
            profile={profile}
            isOwner={isOwner}
            isPreview={isOwner && !profile.profile_completed_at}
          />
        </section>
      </main>
    </PageShell>
  );
}
