import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { studioOS } from "@/lib/studioos/vocabulary";

const links = {
  en: {
    product: "Product",
    studios: "Studios",
    pricing: "Pricing",
    brand: "Brand portal",
    studio: "Studio portal",
    rights: "All rights reserved."
  },
  zh: {
    product: "产品",
    studios: "Studio 作品库",
    pricing: "价格",
    brand: "Brand 门户",
    studio: "创作者",
    rights: "保留所有权利。"
  }
};

export function MarketingFooter({ locale }: { locale: Locale }) {
  const t = links[locale];

  return (
    <footer className="border-t border-zinc-200/80 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href={withLocale("/", locale)} className="inline-flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              {studioOS.productName}
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-zinc-500">
              {locale === "zh"
                ? "连接全球品牌与下一代 AI 驱动创意制作的基础设施。"
                : "Infrastructure connecting global brands with AI-powered creative production."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">{t.product}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-600">
                <li>
                  <Link href={withLocale("/how-it-works", locale)} className="hover:text-zinc-950">
                    {locale === "zh" ? "如何运作" : "How it works"}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">{t.studios}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-600">
                <li>
                  <Link href={withLocale("/creators", locale)} className="hover:text-zinc-950">
                    {t.studios}
                  </Link>
                </li>
                <li>
                  <Link href={withLocale("/pricing", locale)} className="hover:text-zinc-950">
                    {t.pricing}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">Portals</p>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-600">
                <li>
                  <Link href={withLocale("/login?role=brand", locale)} className="hover:text-zinc-950">
                    {t.brand}
                  </Link>
                </li>
                <li>
                  <Link href={withLocale("/login?role=creator", locale)} className="hover:text-zinc-950">
                    {t.studio}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-100 pt-8 text-xs text-zinc-400">
          © {new Date().getFullYear()} {studioOS.productName}. {t.rights}
        </div>
      </div>
    </footer>
  );
}
