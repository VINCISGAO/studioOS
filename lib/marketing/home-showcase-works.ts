import "server-only";

import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";
import { marketingShowcaseRepository } from "@/features/marketing-showcase/marketing-showcase.repository";
import { mergeCuratedHomepageShowcaseWorks } from "@/lib/marketing/home-showcase-curated";
import { filterOfficialShowcaseWorks, sanitizeShowcaseWorkForDisplay } from "@/lib/marketing/showcase-official";

/** Homepage featured works — DB overlay + owner-curated slots. */
export async function loadHomeShowcaseWorks(): Promise<MarketingShowcaseWorkDto[]> {
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
