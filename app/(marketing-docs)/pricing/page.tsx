import { PricingPageView } from "@/components/marketing/pricing/pricing-page";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import type { Metadata } from "next";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return marketingDocsMetadata("zh", "pricing");
}

export default function PricingRoute() {
  return <PricingPageView locale="zh" />;
}
