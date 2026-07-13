import { after } from "next/server";
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

export class ReferenceAnalysisService {
  scheduleAnalysis(assetId: string, legacyProjectId: string, locale: Locale = "zh") {
    const run = () => {
      void this.analyzeReferenceAsset(assetId, legacyProjectId, locale).catch((error) => {
        logger.error("Reference analysis job failed", {
          service: "ReferenceAnalysisService",
          assetId,
          legacyProjectId,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    };

    try {
      after(run);
    } catch {
      run();
    }
  }

  async analyzeReferenceAsset(assetId: string, legacyProjectId: string, locale: Locale = "zh") {
    if (!hasDatabaseUrl()) return null;

    const campaign = await campaignRepository.findByLegacyProjectIdWithRelations(legacyProjectId);
    if (!campaign) return null;

    const asset = (campaign.assets ?? []).find((item) => item.id === assetId);
    if (!asset) return null;

    const meta = (asset.metadataJson ?? {}) as ReferenceAssetMetadata;
    if (meta.kind !== REFERENCE_ASSET_META_KIND) return null;

    const referenceType = (meta.reference_type as StoredProjectReference["type"]) ?? detectReferenceType(meta.source_url);
    const inputKind = meta.input_kind ?? detectReferenceInputKind(meta.source_url, referenceType);

    await assetRepository.updateMetadataJson(assetId, campaign.id, {
      ...meta,
      analysis: {
        status: "analyzing",
        input_kind: inputKind,
        access_status: referenceAccessStatus(referenceType, inputKind),
        platform_label: referencePlatformLabel(referenceType, locale)
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
