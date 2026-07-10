import "server-only";

import { unstable_cache } from "next/cache";
import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { marketingShowcaseRepository } from "@/features/marketing-showcase/marketing-showcase.repository";
import { mergeCuratedHomepageShowcaseWorks } from "@/lib/marketing/home-showcase-curated";
import { filterOfficialShowcaseWorks, sanitizeShowcaseWorkForDisplay } from "@/lib/marketing/showcase-official";

async function loadHomeShowcaseWorksUncached(): Promise<MarketingShowcaseWorkDto[]> {
  let works: MarketingShowcaseWorkDto[] = [];

  if (marketingShowcaseRepository.isAvailable()) {
    try {
      const fromDb = await marketingShowcaseRepository.listHomepageFeatured(8);
      works = filterOfficialShowcaseWorks(fromDb);
    } catch {
      works = [];
    }
  }

  return mergeCuratedHomepageShowcaseWorks(works).map(sanitizeShowcaseWorkForDisplay);
}

const loadHomeShowcaseWorksCached = unstable_cache(
  loadHomeShowcaseWorksUncached,
  ["home-showcase-works"],
  { revalidate: 300 }
);

/** Homepage featured works — DB overlay + owner-curated slots (cached 5m). */
export async function loadHomeShowcaseWorks(): Promise<MarketingShowcaseWorkDto[]> {
  return loadHomeShowcaseWorksCached();
}
