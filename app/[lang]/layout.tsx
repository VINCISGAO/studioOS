import { notFound } from "next/navigation";
import { MarketingLayout } from "@/components/layouts/marketing-layout";
import { isKnowledgePathPrefix } from "@/features/knowledge-center/knowledge-center.constants";

export default async function KnowledgeLangLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isKnowledgePathPrefix(lang)) notFound();
  return <MarketingLayout>{children}</MarketingLayout>;
}
