import { AboutPage } from "@/components/marketing/about/about-page";
import { buildAboutJsonLdGraph } from "@/lib/marketing/structured-data/about";
import { JsonLdScript } from "@/lib/marketing/structured-data/json-ld-script";
import { marketingSeoMetadata } from "@/lib/marketing/marketing-seo-metadata";
import type { Metadata } from "next";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return marketingSeoMetadata("zh", "about", "/about");
}

export default function AboutRoute() {
  return (
    <>
      <JsonLdScript data={buildAboutJsonLdGraph("zh")} />
      <AboutPage locale="zh" />
    </>
  );
}
