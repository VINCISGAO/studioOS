import type { Locale } from "@/lib/i18n";
import {
  labelCountry,
  labelDeliverySpeed,
  labelPlatform,
  labelWorkCategory
} from "@/lib/localized-options";
import { creatorMinBudgetLabel, normalizeCreatorMinBudget } from "@/lib/studioos/creator-price-preference";
import type { Creator, CreatorWork } from "@/lib/types";

export type WorksHeroStat = {
  key: string;
  label: string;
  value: string;
  subtext?: string;
  icon: "works" | "turnaround" | "price" | "rating" | "location";
};

export type WorksFilterState = {
  query: string;
  platform: string;
  category: string;
  tag: string;
};

const allValue = "all";

export function buildCreatorWorksProfileTags(creator: Creator, locale: Locale): string[] {
  if (creator.ai_tags?.length) {
    return creator.ai_tags.slice(0, 5);
  }

  const fromDomains = (creator.expertise_domains ?? []).map((domain) => labelWorkCategory(domain, locale));
  const fromSpecialties = creator.specialties.map((specialty) => {
    const labeled = labelWorkCategory(specialty, locale);
    return labeled !== specialty ? labeled : specialty;
  });

  return [...new Set([...fromDomains, ...fromSpecialties].filter(Boolean))].slice(0, 5);
}

export function formatCreatorWorksLocation(creator: Creator, locale: Locale): string {
  const country = labelCountry(creator.country, locale);
  if (creator.country === "South Korea") {
    return locale === "zh" ? "韩国 · Seoul" : "South Korea · Seoul";
  }
  return country;
}

export function buildCreatorWorksHeroStats(
  creator: Creator,
  worksCount: number,
  locale: Locale
): WorksHeroStat[] {
  const minBudget = normalizeCreatorMinBudget(creator.min_project_budget_usd ?? 0);
  const reviewCount = creator.order_rating_count ?? 0;

  if (locale === "zh") {
    return [
      { key: "works", label: "作品数量", value: String(worksCount), icon: "works" },
      {
        key: "turnaround",
        label: "平均交付周期",
        value: labelDeliverySpeed(creator.delivery_speed, locale),
        icon: "turnaround"
      },
      {
        key: "price",
        label: "起步价格",
        value: minBudget ? creatorMinBudgetLabel(minBudget, locale) : "不限",
        icon: "price"
      },
      {
        key: "rating",
        label: "评分",
        value: creator.rating.toFixed(1),
        subtext: reviewCount ? `${reviewCount} 条评价` : undefined,
        icon: "rating"
      },
      {
        key: "location",
        label: "所在地",
        value: formatCreatorWorksLocation(creator, locale),
        icon: "location"
      }
    ];
  }

  return [
    { key: "works", label: "Works", value: String(worksCount), icon: "works" },
    {
      key: "turnaround",
      label: "Avg. delivery",
      value: labelDeliverySpeed(creator.delivery_speed, locale),
      icon: "turnaround"
    },
    {
      key: "price",
      label: "Starting price",
      value: minBudget ? creatorMinBudgetLabel(minBudget, locale) : "Any budget",
      icon: "price"
    },
    {
      key: "rating",
      label: "Rating",
      value: creator.rating.toFixed(1),
      subtext: reviewCount ? `${reviewCount} reviews` : undefined,
      icon: "rating"
    },
    {
      key: "location",
      label: "Location",
      value: formatCreatorWorksLocation(creator, locale),
      icon: "location"
    }
  ];
}

export function buildWorksFilterOptions(works: CreatorWork[], locale: Locale) {
  const platforms = new Set<string>();
  const categories = new Set<string>();
  const tags = new Set<string>();

  for (const work of works) {
    platforms.add(work.platform);
    categories.add(work.category);
    for (const tag of work.tags) {
      tags.add(tag);
    }
  }

  return {
    platforms: [...platforms].sort().map((value) => ({
      value,
      label: labelPlatform(value.split("/")[0]?.trim() ?? value, locale)
    })),
    categories: [...categories].sort().map((value) => ({
      value,
      label: labelWorkCategory(value, locale)
    })),
    tags: [...tags].sort().map((value) => ({ value, label: value }))
  };
}

export function filterCreatorWorks(works: CreatorWork[], filters: WorksFilterState, locale: Locale) {
  const query = filters.query.trim().toLowerCase();
  const platform = filters.platform;
  const category = filters.category;
  const tag = filters.tag;

  return works.filter((work) => {
    if (platform !== allValue && !work.platform.toLowerCase().includes(platform.toLowerCase())) {
      return false;
    }

    if (category !== allValue && work.category !== category) {
      return false;
    }

    if (tag !== allValue && !work.tags.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      work.title,
      work.description,
      labelPlatform(work.platform, locale),
      labelWorkCategory(work.category, locale),
      ...work.tags
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export const worksFilterAllValue = allValue;
