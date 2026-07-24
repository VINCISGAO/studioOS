import "server-only";

import { mockVideoAdapter } from "@/features/video-engine/adapters/mock-video.adapter";
import { seedanceVideoAdapter } from "@/features/video-engine/adapters/seedance-video.adapter";
import { isMockVideoProviderEnabled } from "@/features/video-engine/mock-provider-env";
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

const testAdapterOverrides: Partial<Record<VideoProviderId, VideoProviderAdapter>> = {};

export type VideoRoutingResolution = {
  providerId: VideoProviderId | null;
  reason:
    | "SEEDANCE_CONFIGURED"
    | "SEEDANCE_NOT_CONFIGURED"
    | "PROVIDER_UNAVAILABLE"
    | "UNSUPPORTED_MODEL"
    | "MOCK_DEV_ONLY";
  resolvedModel: string | null;
};

export function resolveVideoProviderRouting(
  provider: string,
  modelId: string
): VideoRoutingResolution {
  if (hasSeedance() && (isSeedanceVideoProvider(provider) || isSeedanceVideoModel(modelId))) {
    return {
      providerId: "seedance",
      reason: "SEEDANCE_CONFIGURED",
      resolvedModel: modelId
    };
  }

  if (process.env.NODE_ENV === "production") {
    if (isSeedanceVideoModel(modelId) || isSeedanceVideoProvider(provider)) {
      return {
        providerId: null,
        reason: "SEEDANCE_NOT_CONFIGURED",
        resolvedModel: null
      };
    }
    return {
      providerId: null,
      reason: "UNSUPPORTED_MODEL",
      resolvedModel: null
    };
  }

  if (isMockVideoProviderEnabled()) {
    return {
      providerId: "vincis-mock",
      reason: "MOCK_DEV_ONLY",
      resolvedModel: modelId
    };
  }

  if (isSeedanceVideoModel(modelId) || isSeedanceVideoProvider(provider)) {
    return {
      providerId: null,
      reason: "SEEDANCE_NOT_CONFIGURED",
      resolvedModel: null
    };
  }

  return {
    providerId: null,
    reason: "PROVIDER_UNAVAILABLE",
    resolvedModel: null
  };
}

/** @deprecated Use resolveVideoProviderRouting() for audit-friendly routing metadata. */
export function resolveVideoProviderId(provider: string, modelId: string): VideoProviderId {
  const routing = resolveVideoProviderRouting(provider, modelId);
  if (routing.providerId) {
    return routing.providerId;
  }
  return "seedance";
}

export function setVideoProviderAdapterForTests(
  providerId: VideoProviderId,
  adapter: VideoProviderAdapter | null
) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("setVideoProviderAdapterForTests is only available in test runtime");
  }
  if (adapter) {
    testAdapterOverrides[providerId] = adapter;
    return;
  }
  delete testAdapterOverrides[providerId];
}

export function resetVideoProviderAdaptersForTests() {
  for (const key of Object.keys(testAdapterOverrides) as VideoProviderId[]) {
    delete testAdapterOverrides[key];
  }
}

export function getVideoProviderAdapter(providerId: string): VideoProviderAdapter {
  const normalized: VideoProviderId = providerId === "seedance" ? "seedance" : "vincis-mock";
  if (process.env.NODE_ENV === "test" && testAdapterOverrides[normalized]) {
    return testAdapterOverrides[normalized]!;
  }
  if (normalized === "seedance") {
    return ADAPTERS.seedance;
  }
  return ADAPTERS["vincis-mock"];
}

export function listVideoProviderAdapters(): VideoProviderAdapter[] {
  return Object.values(ADAPTERS);
}
