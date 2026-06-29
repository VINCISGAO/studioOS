import { Plus_Jakarta_Sans } from "next/font/google";

export const marketingHeadlineFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700"],
  adjustFontFallback: true
});

export function marketingHeadlineClassName(locale: "en" | "zh") {
  return locale === "en" ? marketingHeadlineFont.className : undefined;
}
