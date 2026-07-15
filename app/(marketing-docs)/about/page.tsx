import { AboutPage } from "@/components/marketing/about/about-page";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import type { Metadata } from "next";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return marketingDocsMetadata("zh", "about");
}

export default function AboutRoute() {
  return <AboutPage locale="zh" />;
}
