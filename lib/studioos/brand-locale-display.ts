import type { Locale } from "@/lib/i18n";

export function localizeBrandProjectTitle(title: string, locale: Locale): string {
  if (locale !== "zh") return title;
  return title
    .replace(/\s*Campaign\s*$/i, "")
    .replace(/\s*Project\s*$/i, "")
    .replace(/\s*活动\s*$/u, "")
    .replace(/\s*项目\s*$/u, "")
    .trim();
}

export function localizeBrandCategoryLabel(
  category: string,
  locale: Locale
): { value: string; sublabel: string | null } {
  const normalized = category.trim().toLowerCase();
  if (locale === "zh") {
    if (normalized.includes("cpg") || normalized.includes("快消")) {
      return { value: "快消品", sublabel: "大消费" };
    }
    if (normalized.includes("beauty") || normalized.includes("美妆")) {
      return { value: "美妆个护", sublabel: null };
    }
    if (normalized.includes("tech") || normalized.includes("科技")) {
      return { value: "科技数码", sublabel: null };
    }
    const parts = category.split(/[/·|]/).map((part) => part.trim());
    const zhPart = parts.find((part) => /[\u4e00-\u9fff]/.test(part));
    if (zhPart) return { value: zhPart, sublabel: null };
  }
  return { value: category.split(/[/·|]/)[0]?.trim() ?? category, sublabel: null };
}
