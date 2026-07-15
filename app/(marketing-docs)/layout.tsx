import { MarketingDocsLayoutShell } from "@/components/marketing/docs/marketing-docs-layout-shell";

export default function MarketingDocsRouteLayout({ children }: { children: React.ReactNode }) {
  return <MarketingDocsLayoutShell>{children}</MarketingDocsLayoutShell>;
}
