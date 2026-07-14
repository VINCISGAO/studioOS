import type { Locale } from "@/lib/i18n";

export type CasesPageCopy = {
  eyebrow: string;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  searchPlaceholder: string;
  sortLatest: string;
  all: string;
  more: string;
  endOfList: string;
  empty: string;
  noWorks: string;
  noCategory: string;
  backHome: string;
};

const zh: CasesPageCopy = {
  eyebrow: "成功案例",
  titleLead: "作品自己会说话",
  titleAccent: "。",
  subtitle: "精选真实案例视频，按品类浏览，快速了解 VINCIS 可以帮助品牌完成怎样的广告作品。",
  searchPlaceholder: "搜索作品、品类、平台或关键词…",
  sortLatest: "最新发布",
  all: "全部",
  more: "更多",
  endOfList: "已经到底了",
  empty: "没有匹配的作品。",
  noWorks: "暂无精选作品。",
  noCategory: "该分类暂无作品。",
  backHome: "返回首页"
};

const en: CasesPageCopy = {
  eyebrow: "Case studies",
  titleLead: "Works speak for themselves",
  titleAccent: ".",
  subtitle: "Browse selected showcase videos by category and see what VINCIS helps brands produce.",
  searchPlaceholder: "Search works, categories, platforms, or keywords…",
  sortLatest: "Latest",
  all: "All",
  more: "More",
  endOfList: "You’ve reached the end",
  empty: "No works match your search.",
  noWorks: "No showcase works yet.",
  noCategory: "No works in this category yet.",
  backHome: "Back to home"
};

export function casesCopy(locale: Locale): CasesPageCopy {
  return locale === "zh" ? zh : en;
}

/** Primary category pills shown before "More" — matches design order. */
export const CASES_PRIMARY_CATEGORIES = ["Automotive", "Beauty", "Consumer tech"] as const;
