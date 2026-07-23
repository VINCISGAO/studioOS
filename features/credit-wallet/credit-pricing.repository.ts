import type { CreditPricingRuleStatus, GenerationType } from "@prisma/client";
import { prisma } from "@/lib/core/database/prisma";

function normalizeModel(model: string) {
  return model.trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeResolution(value: unknown, generationType?: GenerationType) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;
  if (raw.endsWith("p") || raw.endsWith("k")) return raw;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    if (generationType === "IMAGE") return String(Math.round(numeric));
    if (numeric >= 3840) return "4k";
    if (numeric >= 1920) return "1080p";
    if (numeric >= 1280) return "720p";
    return "480p";
  }
  return raw;
}

function readResolution(type: GenerationType, parameters: Record<string, unknown>) {
  if (type === "IMAGE") {
    return normalizeResolution(
      parameters.width ?? parameters.height ?? parameters.resolution ?? parameters.quality,
      type
    );
  }
  return normalizeResolution(
    parameters.resolution ?? parameters.quality ?? parameters.width ?? parameters.height,
    type
  );
}

function readDuration(parameters: Record<string, unknown>) {
  const duration = Number(parameters.duration ?? parameters.durationSec ?? 0);
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
}

function readOutputCount(parameters: Record<string, unknown>) {
  const count = Number(parameters.outputs ?? parameters.outputCount ?? 1);
  return Number.isFinite(count) && count > 0 ? Math.round(count) : 1;
}

export function inferGenerationMode(
  type: GenerationType,
  parameters: Record<string, unknown>
) {
  if (type === "VIDEO") {
    const hasReference =
      Boolean(parameters.referenceAssetId) ||
      Boolean(parameters.referenceUrl) ||
      Boolean(parameters.referenceNodeId);
    return hasReference ? "IMAGE_TO_VIDEO" : "TEXT_TO_VIDEO";
  }

  if (type === "IMAGE") {
    const hasReference =
      Boolean(parameters.referenceAssetId) ||
      Boolean(parameters.referenceUrl) ||
      Boolean(parameters.referenceNodeId);
    return hasReference ? "IMAGE_TO_IMAGE" : "TEXT_TO_IMAGE";
  }

  const mode = String(parameters.mode ?? "custom").trim().toUpperCase();
  if (mode === "SIMPLE") return "SIMPLE";
  if (mode === "SOUNDTRACK") return "SOUNDTRACK";
  return "CUSTOM";
}

function ruleSpecificity(rule: {
  mode: string | null;
  durationSec: number | null;
  resolution: string | null;
  outputCount: number;
}) {
  return (
    (rule.mode ? 8 : 0) +
    (rule.durationSec != null ? 4 : 0) +
    (rule.resolution ? 2 : 0) +
    (rule.outputCount > 1 ? 1 : 0)
  );
}

export const creditPricingRepository = {
  listRules(includeDisabled = false, statuses?: CreditPricingRuleStatus[]) {
    const where =
      statuses && statuses.length > 0
        ? { status: { in: statuses } }
        : includeDisabled
          ? undefined
          : { status: "PUBLISHED" as const, enabled: true };
    return prisma.creditPricingRule.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { generationType: "asc" }, { model: "asc" }]
    });
  },

  findRuleById(ruleId: string) {
    return prisma.creditPricingRule.findUnique({ where: { id: ruleId } });
  },

  async findBestMatchingRule(input: {
    type: GenerationType;
    model: string;
    parameters: Record<string, unknown>;
    now?: Date;
    includeStatuses?: CreditPricingRuleStatus[];
    preferredRuleId?: string;
  }) {
    const now = input.now ?? new Date();
    const model = normalizeModel(input.model);
    const mode = inferGenerationMode(input.type, input.parameters);
    const durationSec = readDuration(input.parameters);
    const resolution = readResolution(input.type, input.parameters);
    const outputCount = readOutputCount(input.parameters);
    const aspectRatio = String(input.parameters.aspectRatio ?? "").trim() || null;
    const statuses = input.includeStatuses ?? ["PUBLISHED"];

    const candidates = await prisma.creditPricingRule.findMany({
      where: {
        generationType: input.type,
        status: { in: statuses },
        enabled: statuses.includes("PUBLISHED") ? true : undefined,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
      },
      orderBy: [{ sortOrder: "asc" }, { creditPrice: "asc" }]
    });

    const matched = candidates
      .filter((rule) => normalizeModel(rule.model) === model)
      .filter((rule) => !rule.mode || rule.mode === mode)
      .filter(
        (rule) =>
          input.type === "MUSIC" ||
          rule.durationSec == null ||
          rule.durationSec === durationSec
      )
      .filter((rule) => !rule.resolution || normalizeResolution(rule.resolution, input.type) === resolution)
      .filter((rule) => !rule.aspectRatio || rule.aspectRatio === aspectRatio)
      .filter((rule) => rule.outputCount === 1 || rule.outputCount === outputCount)
      .sort((a, b) => {
        if (input.preferredRuleId) {
          if (a.id === input.preferredRuleId) return -1;
          if (b.id === input.preferredRuleId) return 1;
        }
        const specificityDiff = ruleSpecificity(b) - ruleSpecificity(a);
        if (specificityDiff !== 0) return specificityDiff;
        return a.sortOrder - b.sortOrder;
      });

    return matched[0] ?? null;
  }
};
