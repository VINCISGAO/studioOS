import type { Locale } from "@/lib/i18n";

type CasesCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

const zh: CasesCopy = {
  eyebrow: "成功案例",
  title: "作品自己会说话。",
  subtitle: "精选真实案例视频，按品类浏览，快速了解 VINCIS 可以帮助品牌完成怎样的广告作品。"
};

const en: CasesCopy = {
  eyebrow: "Case studies",
  title: "Works speak for themselves.",
  subtitle: "Browse selected showcase videos by category and see what VINCIS helps brands produce."
};

export function casesCopy(locale: Locale): CasesCopy {
  return locale === "zh" ? zh : en;
}
