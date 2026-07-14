import { KnowledgeCenterHomePage } from "@/components/knowledge-center/knowledge-center-home-page";
import { KnowledgeCenterShell } from "@/components/knowledge-center/knowledge-center-shell";
import {
  knowledgeCodeForPathPrefix,
  type KnowledgePathPrefix
} from "@/features/knowledge-center/knowledge-center.constants";
import { loadKnowledgeCenterHomePageData } from "@/features/knowledge-center/knowledge-center-public.service";
import { toUiLocale } from "@/lib/app-language.shared";
import type { Metadata } from "next";

type Props = { params: Promise<{ lang: string }> };

export const runtime = "nodejs";
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const locale = toUiLocale(lang === "zh" ? "zh-CN" : "en");
  return {
    title: locale === "zh" ? "VINCIS 知识中心" : "VINCIS Knowledge Center",
    description:
      locale === "zh"
        ? "VINCIS 官方知识中心 — SEO、帮助中心、学院与 Lucien 共用内容。"
        : "Official VINCIS knowledge for SEO, Help Center, Academy, and Lucien."
  };
}

export default async function KnowledgeIndexPage({ params }: Props) {
  const { lang } = await params;
  const languageCode = knowledgeCodeForPathPrefix(lang);
  const locale = toUiLocale(languageCode);
  const pathPrefix = lang as KnowledgePathPrefix;
  const { articles, categoryCounts } = await loadKnowledgeCenterHomePageData(languageCode);

  return (
    <KnowledgeCenterShell locale={locale} pathPrefix={pathPrefix}>
      <KnowledgeCenterHomePage
        locale={locale}
        pathPrefix={pathPrefix}
        languageCode={languageCode}
        articles={articles}
        categoryCounts={categoryCounts}
      />
    </KnowledgeCenterShell>
  );
}
