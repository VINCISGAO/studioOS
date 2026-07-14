import Link from "next/link";
import { getAppUiLocale } from "@/lib/app-language";
import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { cn } from "@/lib/utils";

const tabs = [
  { href: adminPortalRoutes.knowledge, en: "Articles", zh: "文章列表" },
  { href: adminPortalRoutes.knowledgeSeo, en: "AI SEO Dashboard", zh: "AI SEO 看板" },
  { href: adminPortalRoutes.knowledgeCitations, en: "AI Citation Monitor", zh: "AI 引用监控" },
  { href: adminPortalRoutes.knowledgeNew, en: "New Article", zh: "新建文章" }
] as const;

export default async function AdminKnowledgeLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = await getAppUiLocale();
  const zh = locale === "zh";

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-4">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            className={cn(
              "inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition",
              "border border-zinc-200 bg-white text-zinc-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            )}
          >
            {zh ? tab.zh : tab.en}
          </Link>
        ))}
      </div>
      {children}
    </>
  );
}
