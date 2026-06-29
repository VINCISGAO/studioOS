/** AI Memory config — Relationship Intelligence weights */
export const memoryConfig = {
  promptVersion: "memory-extract-v1",
  relationshipBoostMax: 25,
  sameAsLastTimePatterns: [
    /same as last time/i,
    /like last time/i,
    /和上次一样/,
    /跟上次一样/,
    /还是上次/,
    /as before/i,
    /like before/i
  ],
  factCategories: [
    "style_reference",
    "visual",
    "logo",
    "pacing",
    "subtitle",
    "voiceover",
    "cta",
    "music",
    "color",
    "tools",
    "format",
    "model_casting",
    "general"
  ] as const
} as const;

export type MemoryFactCategory = (typeof memoryConfig.factCategories)[number];
