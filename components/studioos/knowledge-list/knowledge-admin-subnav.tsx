"use client";

import { adminPortalRoutes } from "@/lib/studioos/admin-portal-routes";
import { KNOWLEDGE_ADMIN_RESERVED_IDS } from "@/lib/studioos/knowledge-admin-routes";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, FilePlus, Link2, Radar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: adminPortalRoutes.knowledge, zh: "知识中心", en: "Knowledge", icon: BookOpen, exact: true },
  { href: adminPortalRoutes.knowledgeSeo, zh: "AI SEO 看板", en: "AI SEO", icon: BarChart3 },
  { href: adminPortalRoutes.knowledgeCitations, zh: "AI 引用监控", en: "Citations", icon: Radar },
  { href: adminPortalRoutes.knowledgeNew, zh: "新建文章", en: "New article", icon: FilePlus }
] as const;

function isKnowledgeArticleEditPath(pathname: string) {
  const match = pathname.match(/^\/admin\/knowledge\/([^/]+)\/?$/);
  if (!match?.[1]) return false;
  return !KNOWLEDGE_ADMIN_RESERVED_IDS.has(match[1]);
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (href === adminPortalRoutes.knowledge) {
    if (pathname === href || pathname === `${href}/`) return true;
    return isKnowledgeArticleEditPath(pathname);
  }
  if (exact) return pathname === href || pathname === `${href}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function KnowledgeAdminSubNav({ locale }: { locale: Locale }) {
  const zh = locale === "zh";
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-4">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href, "exact" in tab ? tab.exact : false);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition",
              active
                ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100"
                : "border border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {zh ? tab.zh : tab.en}
            {tab.href === adminPortalRoutes.knowledgeCitations ? <Link2 className="h-3 w-3 opacity-40" /> : null}
          </Link>
        );
      })}
    </div>
  );
}
