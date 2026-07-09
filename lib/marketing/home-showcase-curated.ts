import type { MarketingShowcaseWorkDto } from "@/features/marketing-showcase/marketing-showcase.types";

/** Proxied playback path — object lives on marketing R2 CDN. */
export const PERFUME_SHOWCASE_VIDEO_PATH = "/videos/home/recent-work/Perfume%20advertisement.mp4";

function recentWorkVideo(fileName: string): string {
  return `/videos/home/recent-work/${encodeURI(fileName)}`;
}

/** Owner-approved homepage baseline — real R2 recent-work videos (not deleted, only filtered before). */
export const CURATED_HOMEPAGE_SHOWCASE_WORKS: MarketingShowcaseWorkDto[] = [
  {
    id: "curated_luxury_serum",
    title: "Luxury serum launch film",
    description: "Macro product textures, premium lighting, and fast hook variations for paid social testing.",
    category: "Consumer tech",
    platform: "TikTok / Instagram",
    format: "9:16",
    thumbnail_url: "",
    video_url: recentWorkVideo("luxury-serum-launch.mp4"),
    tags: ["Beauty", "Premium", "Product macro", "Paid social"],
    featured_on_homepage: true,
    homepage_sort_order: 0,
    sort_order: 0,
    is_published: true,
    created_at: "2026-06-18T09:00:00.000Z"
  },
  {
    id: "curated_consumer_tech",
    title: "Consumer tech reveal sequence",
    description: "Sharp AI motion shots and editorial pacing for launch campaigns and product explainers.",
    category: "Automotive",
    platform: "YouTube / Meta",
    format: "16:9 + 9:16",
    thumbnail_url: "",
    video_url: recentWorkVideo("consumer-tech-reveal.mp4"),
    tags: ["Tech", "Launch", "Cinematic", "Explainer"],
    featured_on_homepage: true,
    homepage_sort_order: 1,
    sort_order: 1,
    is_published: true,
    created_at: "2026-06-19T09:00:00.000Z"
  },
  {
    id: "curated_perfume_ad",
    title: "Perfume advertisement",
    description: "Fragrance launch film with cinematic product hero and paid-social pacing.",
    category: "Beauty",
    platform: "TikTok",
    format: "9:16",
    thumbnail_url: "",
    video_url: PERFUME_SHOWCASE_VIDEO_PATH,
    tags: ["Beauty", "Fragrance", "Premium"],
    featured_on_homepage: true,
    homepage_sort_order: 2,
    sort_order: 2,
    is_published: true,
    created_at: "2026-07-09T00:00:00.000Z"
  },
  {
    id: "curated_video_demo",
    title: "Video demo",
    description: "Brand showcase demo cut for paid social and product launch.",
    category: "Consumer tech",
    platform: "TikTok",
    format: "9:16",
    thumbnail_url: "",
    video_url: recentWorkVideo("Video demo.mp4"),
    tags: ["Demo", "Launch", "Paid social"],
    featured_on_homepage: true,
    homepage_sort_order: 3,
    sort_order: 3,
    is_published: true,
    created_at: "2026-07-09T00:00:00.000Z"
  },
  {
    id: "curated_video_demo_2",
    title: "Video demo 2",
    description: "Alternate hero cut and pacing variant for campaign testing.",
    category: "Consumer tech",
    platform: "Meta",
    format: "9:16",
    thumbnail_url: "",
    video_url: recentWorkVideo("Video  demo2.mp4"),
    tags: ["Demo", "Variant", "Meta"],
    featured_on_homepage: true,
    homepage_sort_order: 4,
    sort_order: 4,
    is_published: true,
    created_at: "2026-07-09T00:00:00.000Z"
  }
];

export const PERFUME_HOMEPAGE_SHOWCASE = CURATED_HOMEPAGE_SHOWCASE_WORKS[2];

export const CURATED_SHOWCASE_BY_ID = new Map(
  CURATED_HOMEPAGE_SHOWCASE_WORKS.map((work) => [work.id, work])
);

/** Baseline recent-work videos + admin uploads; curated slots are not overridden by legacy DB rows. */
export function mergeCuratedHomepageShowcaseWorks(works: MarketingShowcaseWorkDto[]): MarketingShowcaseWorkDto[] {
  const curatedSlots = new Set(CURATED_HOMEPAGE_SHOWCASE_WORKS.map((work) => work.homepage_sort_order));
  const bySlot = new Map<number, MarketingShowcaseWorkDto>();

  for (const pinned of CURATED_HOMEPAGE_SHOWCASE_WORKS) {
    bySlot.set(pinned.homepage_sort_order, pinned);
  }

  for (const work of works) {
    if (!work.featured_on_homepage) continue;
    if (curatedSlots.has(work.homepage_sort_order) && !work.video_url.includes("/videos/marketing/showcase/")) {
      continue;
    }
    bySlot.set(work.homepage_sort_order, work);
  }

  return [...bySlot.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, work]) => work)
    .slice(0, 5);
}
