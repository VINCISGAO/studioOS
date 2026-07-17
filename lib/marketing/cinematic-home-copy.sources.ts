import { cinematicCopy } from "@/lib/marketing/cinematic-copy";

type CinematicSection = keyof typeof cinematicCopy;

function sectionCopy<K extends CinematicSection>(section: K, lang: "en" | "zh") {
  return cinematicCopy[section][lang];
}

export const cinematicHomeCopyEn = Object.fromEntries(
  (Object.keys(cinematicCopy) as CinematicSection[]).map((section) => [section, sectionCopy(section, "en")])
) as { [K in CinematicSection]: (typeof cinematicCopy)[K]["en"] };

export const cinematicHomeCopyZhCN = Object.fromEntries(
  (Object.keys(cinematicCopy) as CinematicSection[]).map((section) => [section, sectionCopy(section, "zh")])
) as { [K in CinematicSection]: (typeof cinematicCopy)[K]["zh"] };
