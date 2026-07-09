import "server-only";

import { unstable_cache } from "next/cache";
import { marketingShowcaseRepository } from "@/features/marketing-showcase/marketing-showcase.repository";
import type {
  MarketingShowcaseWorkDto,
  UpsertMarketingShowcaseWorkInput
} from "@/features/marketing-showcase/marketing-showcase.types";
import { CURATED_HOMEPAGE_SHOWCASE_WORKS, CURATED_SHOWCASE_BY_ID } from "@/lib/marketing/home-showcase-curated";
import {
  dedupeShowcaseWorks,
  filterOfficialShowcaseWorks,
  sanitizeShowcaseWorkForDisplay
} from "@/lib/marketing/showcase-official";

function appendCuratedPublishedWorks(works: MarketingShowcaseWorkDto[]): MarketingShowcaseWorkDto[] {
  const merged = [...works, ...CURATED_HOMEPAGE_SHOWCASE_WORKS.filter((work) => work.is_published)];
  return dedupeShowcaseWorks(merged).sort((left, right) => left.sort_order - right.sort_order);
}

const listPublishedCached = unstable_cache(
  async (category?: string) => {
    const works = await marketingShowcaseRepository.listPublished(category);
    return filterOfficialShowcaseWorks(works);
  },
  ["marketing-showcase-published-v3"],
  { revalidate: 60 }
);

const listHomepageCached = unstable_cache(
  async (limit: number) => {
    const works = await marketingShowcaseRepository.listHomepageFeatured(limit);
    return filterOfficialShowcaseWorks(works);
  },
  ["marketing-showcase-homepage-v3"],
  { revalidate: 60 }
);

export class MarketingShowcaseService {
  async listPublished(category?: string) {
    const works = await listPublishedCached(category);
    const merged = appendCuratedPublishedWorks(works);
    if (!category) return merged;
    return merged.filter((work) => work.category === category);
  }

  async listHomepageFeatured(limit = 8) {
    return listHomepageCached(limit);
  }

  async listCategories() {
    const works = await this.listPublished();
    const categories = [...new Set(works.map((work) => work.category).filter(Boolean))];
    return categories.sort((a, b) => a.localeCompare(b));
  }

  async findById(id: string) {
    const curated = CURATED_SHOWCASE_BY_ID.get(id);
    if (curated) return sanitizeShowcaseWorkForDisplay(curated);

    const work = await marketingShowcaseRepository.findById(id);
    if (!work || !filterOfficialShowcaseWorks([work]).length) return null;
    return sanitizeShowcaseWorkForDisplay(work);
  }

  async listAdmin() {
    return marketingShowcaseRepository.listAdmin();
  }

  async create(input: UpsertMarketingShowcaseWorkInput) {
    return marketingShowcaseRepository.create(input);
  }

  async update(id: string, input: UpsertMarketingShowcaseWorkInput) {
    return marketingShowcaseRepository.update(id, input);
  }

  async remove(id: string) {
    await marketingShowcaseRepository.softDelete(id);
  }
}

export const marketingShowcaseService = new MarketingShowcaseService();
