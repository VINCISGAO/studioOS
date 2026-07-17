import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildContactJsonLdGraph } from "@/lib/marketing/structured-data/contact";
import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
import { contactSeoMetadata } from "@/lib/marketing/marketing-seo-metadata";
import { getLocale, type SearchParams, withLocale } from "@/lib/i18n";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const locale = getLocale(await searchParams);
  return contactSeoMetadata(locale);
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = getLocale(await searchParams);

  return (
    <>
      <JsonLdScript data={buildContactJsonLdGraph(locale)} />
      <MarketingShell locale={locale}>
      <main className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">{locale === "zh" ? "联系" : "Contact"}</h1>
        <p className="mt-4 text-zinc-500">
          {locale === "zh"
            ? "告诉我们你的下一个 Campaign。"
            : "Tell us about your next campaign."}
        </p>
        <Card className="mt-10 border-zinc-200/80 shadow-none">
          <CardContent className="space-y-4 p-8">
            <p className="text-sm text-zinc-600">hello@vincis.app</p>
            <Button asChild className="w-full rounded-full">
              <Link href={withLocale("/brand/brief/new", locale)}>
                {locale === "zh" ? "直接开始 Brief" : "Start a brief instead"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </MarketingShell>
    </>
  );
}
