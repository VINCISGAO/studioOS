import { landingCopy } from "@/lib/marketing/landing-copy";

type LandingSection = keyof typeof landingCopy;

function sectionCopy<K extends LandingSection>(section: K, lang: "en" | "zh") {
  return landingCopy[section][lang];
}

export const landingHomeCopyEn = Object.fromEntries(
  (Object.keys(landingCopy) as LandingSection[]).map((section) => [section, sectionCopy(section, "en")])
) as { [K in LandingSection]: (typeof landingCopy)[K]["en"] };

export const landingHomeCopyZhCN = Object.fromEntries(
  (Object.keys(landingCopy) as LandingSection[]).map((section) => [section, sectionCopy(section, "zh")])
) as { [K in LandingSection]: (typeof landingCopy)[K]["zh"] };
