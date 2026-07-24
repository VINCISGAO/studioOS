import type { GenerationType } from "@prisma/client";

function readPositiveInt(raw: string | undefined, fallback: number) {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const generationConcurrencyPolicy = {
  userMaxRunning: readPositiveInt(process.env.AI_USER_MAX_RUNNING, 4),
  userMaxQueued: readPositiveInt(process.env.AI_USER_MAX_QUEUED, 10),
  projectMaxRunning: readPositiveInt(process.env.AI_PROJECT_MAX_RUNNING, 4),
  projectMaxQueued: readPositiveInt(process.env.AI_PROJECT_MAX_QUEUED, 12),
  providerMaxQueued: readPositiveInt(process.env.AI_PROVIDER_MAX_QUEUED, 50),
  typeRunningLimit: {
    IMAGE: readPositiveInt(process.env.AI_IMAGE_USER_MAX_RUNNING, 4),
    VIDEO: readPositiveInt(process.env.AI_VIDEO_USER_MAX_RUNNING, 1),
    MUSIC: readPositiveInt(process.env.AI_MUSIC_USER_MAX_RUNNING, 1)
  } satisfies Record<GenerationType, number>,
  typeQueuedLimit: {
    IMAGE: readPositiveInt(process.env.AI_IMAGE_USER_MAX_QUEUED, 8),
    VIDEO: readPositiveInt(process.env.AI_VIDEO_USER_MAX_QUEUED, 4),
    MUSIC: readPositiveInt(process.env.AI_MUSIC_USER_MAX_QUEUED, 4)
  } satisfies Record<GenerationType, number>,
  providerRunningLimit(input: { provider: string; type: GenerationType }) {
    if (input.provider === "seedance" || input.type === "VIDEO") {
      return readPositiveInt(process.env.SEEDANCE_MAX_CONCURRENT, 1);
    }
    if (input.provider === "mureka" || input.type === "MUSIC") {
      return readPositiveInt(process.env.MUREKA_MAX_CONCURRENT, 1);
    }
    return readPositiveInt(process.env.IMAGE_PROVIDER_MAX_CONCURRENT, 4);
  }
} as const;
