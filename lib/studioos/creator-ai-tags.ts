import type { CreatorWork } from "@/lib/types";

const DOMAIN_TAG_MAP: Record<string, string[]> = {
  Beauty: ["美妆护肤", "Premium visual", "Product macro"],
  "Consumer packaged goods": ["CPG", "Product demo", "E-commerce"],
  "Consumer tech": ["Tech launch", "Feature demo", "SaaS ad"],
  Fashion: ["Fashion film", "Lookbook", "Lifestyle"],
  "Food and beverage": ["F&B", "Appetite appeal", "Packshot"],
  Home: ["Home & living", "Interior mood", "Lifestyle"],
  "Travel accessories": ["Travel gear", "Outdoor", "Lifestyle"],
  Other: ["General commercial"]
};

const TOOL_TAG_MAP: Record<string, string> = {
  Runway: "AI video",
  Midjourney: "AI image",
  Kling: "AI video",
  "After Effects": "Motion design",
  "Premiere Pro": "Post-production",
  "DaVinci Resolve": "Color grade",
  Topaz: "AI upscale",
  ElevenLabs: "AI voice"
};

const PLATFORM_TAGS = ["TikTok", "Meta ads", "YouTube", "Instagram Reels", "Amazon video"];

export function generateCreatorAiTags(input: {
  bio: string;
  headline: string;
  specialties: string[];
  expertise_domains: string[];
  tools: string[];
  works: CreatorWork[];
}): string[] {
  const tags = new Set<string>();

  for (const domain of input.expertise_domains) {
    for (const tag of DOMAIN_TAG_MAP[domain] ?? [domain]) {
      tags.add(tag);
    }
  }

  for (const specialty of input.specialties) {
    tags.add(specialty.trim());
    const lower = specialty.toLowerCase();
    if (lower.includes("ugc")) tags.add("UGC style");
    if (lower.includes("tiktok")) tags.add("TikTok native");
    if (lower.includes("beauty")) tags.add("Beauty");
    if (lower.includes("cpg")) tags.add("CPG");
    if (lower.includes("dtc")) tags.add("DTC growth");
  }

  for (const tool of input.tools) {
    const mapped = TOOL_TAG_MAP[tool];
    if (mapped) tags.add(mapped);
    tags.add(tool);
  }

  for (const work of input.works) {
    if (work.category) tags.add(work.category);
    for (const tag of work.tags) tags.add(tag);
    if (work.platform) {
      for (const platformTag of PLATFORM_TAGS) {
        if (work.platform.toLowerCase().includes(platformTag.toLowerCase())) {
          tags.add(platformTag);
        }
      }
    }
  }

  const text = `${input.bio} ${input.headline}`.toLowerCase();
  if (text.includes("cinematic")) tags.add("Cinematic");
  if (text.includes("performance") || text.includes("转化")) tags.add("Performance creative");
  if (text.includes("ai")) tags.add("AI-native production");

  return [...tags]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}
