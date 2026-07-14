import { assetRepository } from "@/features/campaign/asset.repository";
import { campaignRepository } from "@/features/campaign/campaign.repository";
import {
  REFERENCE_ASSET_META_KIND,
  type ReferenceAssetMetadata
} from "@/features/campaign/brand-campaign/brand-campaign.types";
import { mapReferenceAssetToStoredProjectReference } from "@/features/campaign/brand-campaign/brand-campaign.mapper";
import { runReferenceAnalysis, buildTemplateReferenceReport } from "@/features/campaign/reference-analysis.runner";
import { detectReferenceType } from "@/lib/campaign/reference-type";
import type { StoredProjectReference } from "@/lib/campaign-types";
import { logger } from "@/lib/core/logger";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import {
  detectReferenceInputKind,
  referenceAccessStatus,
  referencePlatformLabel
} from "@/lib/studioos/reference-platform";
import type {
  ReferenceAnalysisInput,
  ReferenceAnalysisState
} from "@/lib/studioos/reference-analysis.types";
import type { Locale } from "@/lib/i18n";

function initialAnalysisState(input: {
  referenceType: StoredProjectReference["type"];
  inputKind: ReferenceAnalysisState["input_kind"];
  locale: Locale;
}): ReferenceAnalysisState {
  return {
    status: "pending",
    input_kind: input.inputKind,
    access_status: referenceAccessStatus(input.referenceType, input.inputKind),
    platform_label: referencePlatformLabel(input.referenceType, input.locale)
  };
}

const STALE_ANALYZING_MS = 90_000;

export class ReferenceAnalysisService {
  private readonly inFlight = new Set<string>();

  scheduleAnalysis(
    assetId: string,
    legacyProjectId: string,
    locale: Locale = "zh",
    options?: { force?: boolean }
  ) {
    if (!options?.force && this.inFlight.has(assetId)) return;

    this.inFlight.add(assetId);
    void this.analyzeReferenceAsset(assetId, legacyProjectId, locale, options)
      .catch((error) => {
        logger.error("Reference analysis job failed", {
          service: "ReferenceAnalysisService",
          assetId,
          legacyProjectId,
          error: error instanceof Error ? error.message : String(error)
        });
      })
      .finally(() => {
        this.inFlight.delete(assetId);
      });
  }

  ensureReferenceAnalysesRunning(
    legacyProjectId: string,
    locale: Locale,
    references: StoredProjectReference[]
  ) {
    for (const reference of references) {
      const status = reference.analysis?.status;
      if (status === "pending") {
        this.scheduleAnalysis(reference.id, legacyProjectId, locale);
        continue;
      }

      if (status === "analyzing") {
        const startedAt = reference.analysis?.analysis_started_at;
        const elapsed = startedAt ? Date.now() - new Date(startedAt).getTime() : STALE_ANALYZING_MS + 1;
        if (elapsed > STALE_ANALYZING_MS) {
          this.scheduleAnalysis(reference.id, legacyProjectId, locale, { force: true });
        }
      }
    }
  }

  async analyzeReferenceAsset(
    assetId: string,
    legacyProjectId: string,
    locale: Locale = "zh",
    options?: { force?: boolean }
  ) {
    if (!hasDatabaseUrl()) return null;

    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(legacyProjectId);
    if (!campaign) {
      logger.warn("Reference analysis skipped: campaign not found", {
        service: "ReferenceAnalysisService",
        assetId,
        legacyProjectId
      });
      return null;
    }

    const asset = (campaign.assets ?? []).find((item) => item.id === assetId);
    if (!asset) {
      logger.warn("Reference analysis skipped: asset not found", {
        service: "ReferenceAnalysisService",
        assetId,
        legacyProjectId,
        campaignId: campaign.id
      });
      return null;
    }

    const meta = (asset.metadataJson ?? {}) as ReferenceAssetMetadata;
    if (meta.kind !== REFERENCE_ASSET_META_KIND) return null;

    const referenceType = (meta.reference_type as StoredProjectReference["type"]) ?? detectReferenceType(meta.source_url);
    const inputKind = meta.input_kind ?? detectReferenceInputKind(meta.source_url, referenceType);
    const currentAnalysis = meta.analysis;

    if (
      !options?.force &&
      currentAnalysis?.status === "analyzing" &&
      currentAnalysis.analysis_started_at &&
      Date.now() - new Date(currentAnalysis.analysis_started_at).getTime() < STALE_ANALYZING_MS
    ) {
      return null;
    }

    const startedAt = new Date().toISOString();

    await assetRepository.updateMetadataJson(assetId, campaign.id, {
      ...meta,
      analysis: {
        status: "analyzing",
        input_kind: inputKind,
        access_status: referenceAccessStatus(referenceType, inputKind),
        platform_label: referencePlatformLabel(referenceType, locale),
        analysis_started_at: startedAt
      }
    });

    const brandContext =
      typeof campaign.productionBrief === "object" && campaign.productionBrief
        ? String((campaign.productionBrief as Record<string, unknown>).productDescription ?? "")
        : "";

    const input: ReferenceAnalysisInput = {
      referenceId: assetId,
      campaignId: campaign.id,
      legacyProjectId,
      sourceUrl: meta.source_url,
      referenceType,
      inputKind,
      note: meta.note,
      brandContext,
      locale: locale === "zh" ? "zh" : "en"
    };

    try {
      const { report, provider } = await runReferenceAnalysis(input);
      const analysis: ReferenceAnalysisState = {
        status: "ready",
        input_kind: inputKind,
        access_status: referenceAccessStatus(referenceType, inputKind),
        platform_label: referencePlatformLabel(referenceType, locale),
        report,
        analyzed_at: new Date().toISOString(),
        provider
      };

      const updated = await assetRepository.updateMetadataJson(assetId, campaign.id, {
        ...meta,
        input_kind: inputKind,
        analysis
      });

      return mapReferenceAssetToStoredProjectReference(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await assetRepository.updateMetadataJson(assetId, campaign.id, {
        ...meta,
        analysis: {
          status: "failed",
          input_kind: inputKind,
          access_status: referenceAccessStatus(referenceType, inputKind),
          platform_label: referencePlatformLabel(referenceType, locale),
          analysis_error: message,
          analyzed_at: new Date().toISOString()
        }
      });
      return null;
    }
  }

  createPendingMetadata(input: {
    metadata: ReferenceAssetMetadata;
    referenceType: StoredProjectReference["type"];
    locale: Locale;
  }): ReferenceAssetMetadata {
    const inputKind = input.metadata.input_kind ?? detectReferenceInputKind(input.metadata.source_url, input.referenceType);
    return {
      ...input.metadata,
      input_kind: inputKind,
      analysis: initialAnalysisState({
        referenceType: input.referenceType,
        inputKind,
        locale: input.locale
      })
    };
  }

  attachTemplateAnalysisToReference(ref: StoredProjectReference, locale: Locale, brandContext?: string): StoredProjectReference {
    const inputKind = detectReferenceInputKind(ref.source_url, ref.type);
    const report = buildTemplateReferenceReport({
      referenceId: ref.id,
      campaignId: "",
      legacyProjectId: ref.project_id,
      sourceUrl: ref.source_url,
      referenceType: ref.type,
      inputKind,
      note: ref.note,
      brandContext,
      locale: locale === "zh" ? "zh" : "en"
    });

    return {
      ...ref,
      analysis: {
        status: "ready",
        input_kind: inputKind,
        access_status: referenceAccessStatus(ref.type, inputKind),
        platform_label: referencePlatformLabel(ref.type, locale),
        report,
        analyzed_at: new Date().toISOString(),
        provider: "template"
      }
    };
  }
}

export const referenceAnalysisService = new ReferenceAnalysisService();
