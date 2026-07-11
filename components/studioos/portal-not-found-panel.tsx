import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";

const copy = {
  en: {
    title: "Project not found",
    body: "This project may have been deleted or you may not have access to it.",
    back: "Back to projects"
  },
  zh: {
    title: "未找到项目",
    body: "该项目可能已被删除，或你无权访问。",
    back: "返回项目列表"
  }
} as const;

type PortalNotFoundProps = {
  locale: Locale;
  backHref: string;
};

export function PortalNotFoundPanel({ locale, backHref }: PortalNotFoundProps) {
  const t = copy[locale];
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{t.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-500">{t.body}</p>
      <Button asChild className="mt-8 rounded-xl">
        <Link href={withLocale(backHref, locale)}>
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
      </Button>
    </div>
  );
}
