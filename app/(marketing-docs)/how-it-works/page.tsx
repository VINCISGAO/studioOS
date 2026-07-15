import { ProcessPage } from "@/components/marketing/process/process-page";
import { marketingDocsMetadata } from "@/lib/marketing/marketing-docs-metadata";
import type { Metadata } from "next";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return marketingDocsMetadata("zh", "process");
}

export default function HowItWorksRoute() {
  return <ProcessPage locale="zh" />;
}
