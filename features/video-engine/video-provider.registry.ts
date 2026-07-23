import "server-only";

import { mockVideoAdapter } from "@/features/video-engine/adapters/mock-video.adapter";
import { seedanceVideoAdapter } from "@/features/video-engine/adapters/seedance-video.adapter";
import type {
  VideoProviderAdapter,
  VideoProviderId
} from "@/features/video-engine/video-provider.types";
import { isSeedanceVideoModel, isSeedanceVideoProvider } from "@/lib/canvas/seedance-client";
import { hasSeedance } from "@/lib/core/config/ai";

const ADAPTERS: Record<VideoProviderId, VideoProviderAdapter> = {
  seedance: seedanceVideoAdapter,
  "vincis-mock": mockVideoAdapter
};

export function resolveVideoProviderId(provider: string, modelId: string): VideoProviderId {
  if (hasSeedance() && (isSeedanceVideoProvider(provider) || isSeedanceVideoModel(modelId))) {
    return "seedance";
  }
  return "vincis-mock";
}

export function getVideoProviderAdapter(providerId: string): VideoProviderAdapter {
  if (providerId === "seedance") {
    return ADAPTERS.seedance;
  }
  return ADAPTERS["vincis-mock"];
}

export function listVideoProviderAdapters(): VideoProviderAdapter[] {
  return Object.values(ADAPTERS);
}
