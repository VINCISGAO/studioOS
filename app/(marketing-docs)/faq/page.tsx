import { FaqPage } from "@/components/marketing/faq/faq-page";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import type { Metadata } from "next";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return marketingDocsMetadata("zh", "faq");
}

export default function FaqRoute() {
  return <FaqPage locale="zh" />;
}
