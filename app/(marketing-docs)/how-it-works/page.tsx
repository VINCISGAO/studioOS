import { ProcessPage } from "@/components/marketing/process/process-page";
import { marketingSeoMetadata } from "@/lib/marketing/marketing-seo-metadata";
import type { Metadata } from "next";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return marketingSeoMetadata("zh", "process", "/how-it-works");
}

export default function HowItWorksRoute() {
  return <ProcessPage locale="zh" />;
}
