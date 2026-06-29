import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { withLocale } from "@/lib/i18n";
import { studioOS } from "@/lib/studioos/vocabulary";
import { cn } from "@/lib/utils";

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

export function MarketingFooter({
  locale,
  tone = "light"
}: {
  locale: Locale;
  tone?: "light" | "dark";
}) {
  const t = links[locale];
  const dark = tone === "dark";

  return (
    <footer
      className={cn(
        "border-t",
        dark ? "border-white/[0.06] bg-[#030303] text-white" : "border-zinc-200/80 bg-white"
      )}
    >
      <div className="mx-auto max-w-[1200px] px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xs">
            <Link
              href={withLocale("/", locale)}
              className={cn("text-[15px] font-medium tracking-[-0.02em]", dark ? "text-white" : "text-zinc-950")}
            >
              {studioOS.productName}
            </Link>
            <p className={cn("mt-4 text-[14px] leading-7", dark ? "text-zinc-500" : "text-zinc-500")}>
              {locale === "zh" ? studioOS.tagline.zh : studioOS.tagline.en}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 sm:gap-16">
            <div>
              <p className={cn("landing-eyebrow", dark ? "text-zinc-600" : "text-zinc-400")}>{t.product}</p>
              <ul className={cn("mt-4 space-y-2.5 text-[14px]", dark ? "text-zinc-500" : "text-zinc-600")}>
                <li>
                  <Link
                    href={withLocale("/how-it-works", locale)}
                    className={cn("transition", dark ? "hover:text-white" : "hover:text-zinc-950")}
                  >
                    {locale === "zh" ? "如何运作" : "How it works"}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className={cn("landing-eyebrow", dark ? "text-zinc-600" : "text-zinc-400")}>{t.studios}</p>
              <ul className={cn("mt-4 space-y-2.5 text-[14px]", dark ? "text-zinc-500" : "text-zinc-600")}>
                <li>
                  <Link
                    href={withLocale("/creators", locale)}
                    className={cn("transition", dark ? "hover:text-white" : "hover:text-zinc-950")}
                  >
                    {t.studios}
                  </Link>
                </li>
                <li>
                  <Link
                    href={withLocale("/pricing", locale)}
                    className={cn("transition", dark ? "hover:text-white" : "hover:text-zinc-950")}
                  >
                    {t.pricing}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className={cn("landing-eyebrow", dark ? "text-zinc-600" : "text-zinc-400")}>Portals</p>
              <ul className={cn("mt-4 space-y-2.5 text-[14px]", dark ? "text-zinc-500" : "text-zinc-600")}>
                <li>
                  <Link
                    href={withLocale("/login?role=brand", locale)}
                    className={cn("transition", dark ? "hover:text-white" : "hover:text-zinc-950")}
                  >
                    {t.brand}
                  </Link>
                </li>
                <li>
                  <Link
                    href={withLocale("/login?role=creator", locale)}
                    className={cn("transition", dark ? "hover:text-white" : "hover:text-zinc-950")}
                  >
                    {t.studio}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "mt-12 border-t pt-8 text-[12px]",
            dark ? "border-white/[0.06] text-zinc-600" : "border-zinc-100 text-zinc-400"
          )}
        >
          © {new Date().getFullYear()} {studioOS.productName}. {t.rights}
        </div>
      </div>
    </footer>
  );
}
