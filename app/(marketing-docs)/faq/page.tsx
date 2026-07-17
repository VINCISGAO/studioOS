import { FaqPage } from "@/components/marketing/faq/faq-page";
import { buildMarketingFaqJsonLdGraph } from "@/lib/marketing/structured-data/faq-page";
import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
import { marketingSeoMetadata } from "@/lib/marketing/marketing-seo-metadata";
import type { Metadata } from "next";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return marketingSeoMetadata("zh", "faq", "/faq");
}

export default function FaqRoute() {
  return (
    <>
      <JsonLdScript data={buildMarketingFaqJsonLdGraph("zh")} />
      <FaqPage locale="zh" />
    </>
  );
}
