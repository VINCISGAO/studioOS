import { PricingPageView } from "@/components/marketing/pricing/pricing-page";
import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
import { buildPricingJsonLdGraph } from "@/lib/marketing/structured-data/pricing";
import { marketingSeoMetadata } from "@/lib/marketing/marketing-seo-metadata";
import type { Metadata } from "next";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return marketingSeoMetadata("zh", "pricing", "/pricing");
}

export default function PricingRoute() {
  return (
    <>
      <JsonLdScript data={buildPricingJsonLdGraph("zh")} />
      <PricingPageView locale="zh" />
    </>
  );
}
