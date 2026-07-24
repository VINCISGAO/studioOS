import type { CreditPricingRuleStatus, GenerationType, Prisma } from "@prisma/client";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import {
  adminPricingRuleValidationService,
  buildQuoteProbeParameters,
  computePricingMargins
} from "@/features/admin/credits/admin-pricing-rule-validation.service";
import {
  buildRuleSnapshot,
  serializeAdminPricingRule,
  type AdminPricingRuleView
} from "@/features/admin/credits/admin-pricing-rule.serializer";
import { creditPlatformAuditService } from "@/features/admin/credits/credit-platform-audit.service";
import { creditPricingRepository } from "@/features/credit-wallet/credit-pricing.repository";
import { creditPricingService } from "@/features/credit-wallet/credit-pricing.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";
import { asInputJson } from "@/lib/core/prisma-json";

type RuleInput = {
  aiModelId?: string | null;
  provider?: string;
  model?: string;
  generationType?: GenerationType;
  mode?: string | null;
  label?: string | null;
  durationSec?: number | null;
  resolution?: string | null;
  aspectRatio?: string | null;
  inputType?: string | null;
  outputCount?: number;
  providerCostMinor?: number | null;
  creditPrice?: number;
  marginPercent?: number | null;
  refundOnFailure?: boolean;
  minimumBalance?: number;
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  changeReason?: string | null;
  internalNotes?: string | null;
  replacesRuleId?: string | null;
};

function assertMutableStatus(status: CreditPricingRuleStatus) {
  if (status === "PUBLISHED" || status === "ARCHIVED") {
    throw appError("VALIDATION_ERROR", "Published or archived rules are immutable. Duplicate as draft first.");
  }
}

async function loadAiModel(aiModelId: string | null | undefined) {
  if (!aiModelId) return null;
  return prisma.aiModel.findFirst({ where: { id: aiModelId, deletedAt: null } });
}

async function resolveModelDefaults(input: RuleInput) {
  if (input.aiModelId) {
    const aiModel = await loadAiModel(input.aiModelId);
    if (!aiModel) throw appError("NOT_FOUND", "AI model not found");
    return {
      aiModelId: aiModel.id,
      provider: input.provider ?? aiModel.provider,
      model: input.model ?? aiModel.internalModelId,
      generationType: input.generationType ?? aiModel.generationType
    };
  }
  if (!input.provider || !input.model || !input.generationType) {
    throw appError("VALIDATION_ERROR", "Provider, model, and generation type are required");
  }
  return {
    aiModelId: input.aiModelId ?? null,
    provider: input.provider,
    model: input.model,
    generationType: input.generationType
  };
}

async function applyMarginFields(creditPrice: number, providerCostMinor: number | null | undefined, outputCount: number) {
  const margins = await computePricingMargins({
    creditPrice,
    providerCostMinor: providerCostMinor ?? null,
    outputCount
  });
  return {
    marginAmountMinor: margins.marginAmountMinor,
    marginPercent: margins.marginPercent
  };
}

export class AdminPricingRuleService {
  private assertAccess(user: AuthUser) {
    PermissionService.assert(user, "admin.wallet.manage");
    if (!hasDatabaseUrl()) return false;
    return true;
  }

  async list(
    user: AuthUser,
    filters?: {
      q?: string;
      model?: string;
      generationType?: GenerationType;
      status?: CreditPricingRuleStatus;
      unhealthyOnly?: boolean;
    }
  ): Promise<AdminPricingRuleView[]> {
    if (!this.assertAccess(user)) return [];
    const where: Prisma.CreditPricingRuleWhereInput = {};
    if (filters?.model) where.model = filters.model;
    if (filters?.generationType) where.generationType = filters.generationType;
    if (filters?.status) where.status = filters.status;
    if (filters?.q?.trim()) {
      where.OR = [
        { model: { contains: filters.q, mode: "insensitive" } },
        { provider: { contains: filters.q, mode: "insensitive" } },
        { label: { contains: filters.q, mode: "insensitive" } },
        { changeReason: { contains: filters.q, mode: "insensitive" } }
      ];
    }

    const rows = await prisma.creditPricingRule.findMany({
      where,
      include: { aiModel: { select: { displayName: true } } },
      orderBy: [{ status: "asc" }, { model: "asc" }, { version: "desc" }]
    });

    const serialized = await Promise.all(rows.map((row) => serializeAdminPricingRule(row)));
    if (!filters?.unhealthyOnly) return serialized;
    return serialized.filter((row) => row.status === "DRAFT" || row.marginPercent == null || row.marginPercent < 15);
  }

  async get(user: AuthUser, ruleId: string) {
    if (!this.assertAccess(user)) return null;
    const row = await prisma.creditPricingRule.findUnique({
      where: { id: ruleId },
      include: { aiModel: { select: { displayName: true } }, versions: { orderBy: { version: "desc" }, take: 20 } }
    });
    if (!row) return null;
    const audit = await creditPlatformAuditService.list({
      entityType: "PRICING_RULE",
      entityId: row.id,
      limit: 30
    });
    return {
      rule: await serializeAdminPricingRule(row),
      versions: row.versions,
      audit
    };
  }

  async create(user: AuthUser, input: RuleInput) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const defaults = await resolveModelDefaults(input);
    const outputCount = input.outputCount ?? 1;
    const creditPrice = input.creditPrice ?? 1;
    const margins = await applyMarginFields(creditPrice, input.providerCostMinor, outputCount);

    const row = await prisma.creditPricingRule.create({
      data: {
        ...defaults,
        mode: input.mode ?? null,
        label: input.label ?? null,
        durationSec: input.durationSec ?? null,
        resolution: input.resolution ?? null,
        aspectRatio: input.aspectRatio ?? null,
        inputType: input.inputType ?? null,
        outputCount,
        providerCostMinor: input.providerCostMinor ?? null,
        creditPrice,
        marginPercent: input.marginPercent ?? margins.marginPercent,
        marginAmountMinor: margins.marginAmountMinor,
        refundOnFailure: input.refundOnFailure ?? true,
        minimumBalance: input.minimumBalance ?? 0,
        enabled: false,
        status: "DRAFT",
        version: 1,
        sortOrder: input.sortOrder ?? 0,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        changeReason: input.changeReason ?? null,
        internalNotes: input.internalNotes ?? null,
        replacesRuleId: input.replacesRuleId ?? null
      },
      include: { aiModel: { select: { displayName: true } } }
    });

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "pricing_rule.draft_created",
      entityType: "PRICING_RULE",
      entityId: row.id,
      metadata: { model: row.model, version: row.version }
    });

    return serializeAdminPricingRule(row);
  }

  async update(user: AuthUser, ruleId: string, input: RuleInput) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const existing = await prisma.creditPricingRule.findUnique({ where: { id: ruleId } });
    if (!existing) throw appError("NOT_FOUND", "Pricing rule not found");
    assertMutableStatus(existing.status);

    const outputCount = input.outputCount ?? existing.outputCount;
    const creditPrice = input.creditPrice ?? existing.creditPrice;
    const providerCostMinor =
      input.providerCostMinor === undefined ? existing.providerCostMinor : input.providerCostMinor;
    const margins = await applyMarginFields(creditPrice, providerCostMinor, outputCount);

    const row = await prisma.creditPricingRule.update({
      where: { id: ruleId },
      data: {
        mode: input.mode,
        label: input.label,
        durationSec: input.durationSec,
        resolution: input.resolution,
        aspectRatio: input.aspectRatio,
        inputType: input.inputType,
        outputCount: input.outputCount,
        providerCostMinor: input.providerCostMinor,
        creditPrice: input.creditPrice,
        marginPercent: input.marginPercent ?? margins.marginPercent,
        marginAmountMinor: margins.marginAmountMinor,
        refundOnFailure: input.refundOnFailure,
        minimumBalance: input.minimumBalance,
        sortOrder: input.sortOrder,
        startsAt: input.startsAt === undefined ? undefined : input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt === undefined ? undefined : input.endsAt ? new Date(input.endsAt) : null,
        changeReason: input.changeReason,
        internalNotes: input.internalNotes,
        replacesRuleId: input.replacesRuleId,
        status: existing.status === "VALIDATED" ? "DRAFT" : undefined,
        validatedAt: existing.status === "VALIDATED" ? null : undefined
      },
      include: { aiModel: { select: { displayName: true } } }
    });

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "pricing_rule.draft_updated",
      entityType: "PRICING_RULE",
      entityId: row.id,
      metadata: input as Record<string, unknown>
    });

    return serializeAdminPricingRule(row);
  }

  async duplicate(user: AuthUser, ruleId: string, input?: { changeReason?: string }) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const source = await prisma.creditPricingRule.findUnique({ where: { id: ruleId } });
    if (!source) throw appError("NOT_FOUND", "Pricing rule not found");

    const row = await prisma.creditPricingRule.create({
      data: {
        aiModelId: source.aiModelId,
        provider: source.provider,
        model: source.model,
        generationType: source.generationType,
        mode: source.mode,
        label: source.label,
        durationSec: source.durationSec,
        resolution: source.resolution,
        aspectRatio: source.aspectRatio,
        inputType: source.inputType,
        outputCount: source.outputCount,
        providerCostMinor: source.providerCostMinor,
        creditPrice: source.creditPrice,
        marginPercent: source.marginPercent,
        marginAmountMinor: source.marginAmountMinor,
        refundOnFailure: source.refundOnFailure,
        minimumBalance: source.minimumBalance,
        enabled: false,
        status: "DRAFT",
        version: source.version + 1,
        sourceRuleId: source.id,
        replacesRuleId: source.status === "PUBLISHED" ? source.id : source.replacesRuleId,
        changeReason: input?.changeReason ?? source.changeReason,
        internalNotes: source.internalNotes,
        sortOrder: source.sortOrder,
        startsAt: source.startsAt,
        endsAt: source.endsAt
      },
      include: { aiModel: { select: { displayName: true } } }
    });

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "pricing_rule.duplicated",
      entityType: "PRICING_RULE",
      entityId: row.id,
      metadata: { sourceRuleId: source.id, version: row.version }
    });

    return serializeAdminPricingRule(row);
  }

  async validate(user: AuthUser, ruleId: string) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const rule = await prisma.creditPricingRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw appError("NOT_FOUND", "Pricing rule not found");
    assertMutableStatus(rule.status);
    const aiModel = await loadAiModel(rule.aiModelId);
    const result = await adminPricingRuleValidationService.validateDraft(rule, aiModel);

    if (result.ok) {
      await prisma.creditPricingRule.update({
        where: { id: ruleId },
        data: { status: "VALIDATED", validatedAt: new Date() }
      });
    }

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: result.ok ? "pricing_rule.validated" : "pricing_rule.validation_failed",
      entityType: "PRICING_RULE",
      entityId: ruleId,
      metadata: { issues: result.issues }
    });

    return result;
  }

  async publish(
    user: AuthUser,
    ruleId: string,
    input: {
      idempotencyKey: string;
      confirm?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      replacesRuleId?: string | null;
      requestId?: string;
    }
  ) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    if (input.confirm !== true) {
      throw appError("VALIDATION_ERROR", "Publishing requires explicit confirmation");
    }

    const existingPublished = await prisma.creditPricingRule.findFirst({
      where: { publishIdempotencyKey: input.idempotencyKey, status: "PUBLISHED" }
    });
    if (existingPublished) {
      return serializeAdminPricingRule(existingPublished);
    }

    const published = await prisma.$transaction(async (tx) => {
      const draft = await tx.creditPricingRule.findUnique({ where: { id: ruleId } });
      if (!draft) throw appError("NOT_FOUND", "Pricing rule not found");
      if (draft.status !== "VALIDATED") {
        throw appError("VALIDATION_ERROR", "Rule must be validated before publish");
      }

      const aiModel = draft.aiModelId
        ? await tx.aiModel.findFirst({ where: { id: draft.aiModelId, deletedAt: null } })
        : null;
      const validation = await adminPricingRuleValidationService.validateDraft(draft, aiModel);
      if (!validation.ok) {
        await creditPlatformAuditService.write({
          actorUserId: user.id,
          action: "pricing_rule.publish_failed",
          entityType: "PRICING_RULE",
          entityId: draft.id,
          metadata: { issues: validation.issues, requestId: input.requestId }
        });
        throw appError("VALIDATION_ERROR", validation.issues.find((i) => i.severity === "error")?.message ?? "Validation failed");
      }

      const replaceId = input.replacesRuleId ?? draft.replacesRuleId;
      if (replaceId) {
        await tx.creditPricingRule.updateMany({
          where: { id: replaceId, status: "PUBLISHED" },
          data: { status: "ARCHIVED", enabled: false, archivedAt: new Date(), endsAt: new Date() }
        });
      }

      const publishedAt = new Date();
      const nextVersion = draft.version;
      const row = await tx.creditPricingRule.update({
        where: { id: draft.id },
        data: {
          status: "PUBLISHED",
          enabled: true,
          publishedAt,
          publishedByUserId: user.id,
          publishIdempotencyKey: input.idempotencyKey,
          startsAt: input.startsAt ? new Date(input.startsAt) : draft.startsAt,
          endsAt: input.endsAt ? new Date(input.endsAt) : draft.endsAt
        },
        include: { aiModel: { select: { displayName: true } } }
      });

      await tx.creditPricingRuleVersion.create({
        data: {
          ruleId: row.id,
          version: nextVersion,
          snapshot: asInputJson(buildRuleSnapshot(row)) ?? {},
          changeReason: row.changeReason,
          publishedAt,
          publishedByUserId: user.id
        }
      });

      return row;
    });

    creditPricingService.invalidateQuoteCache();

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "pricing_rule.published",
      entityType: "PRICING_RULE",
      entityId: published.id,
      metadata: {
        version: published.version,
        replacesRuleId: input.replacesRuleId ?? published.replacesRuleId,
        requestId: input.requestId
      }
    });

    return serializeAdminPricingRule(published);
  }

  async deleteDraft(user: AuthUser, ruleId: string) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const existing = await prisma.creditPricingRule.findUnique({ where: { id: ruleId } });
    if (!existing) throw appError("NOT_FOUND", "Pricing rule not found");
    if (existing.status === "PUBLISHED" || existing.status === "ARCHIVED") {
      throw appError("VALIDATION_ERROR", "Only draft or validated rules can be deleted");
    }

    const deleted = await prisma.creditPricingRule.deleteMany({
      where: { id: ruleId, status: { in: ["DRAFT", "VALIDATED"] } }
    });
    if (deleted.count === 0) {
      throw appError("VALIDATION_ERROR", "Only draft or validated rules can be deleted");
    }

    creditPricingService.invalidateQuoteCache();

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "pricing_rule.deleted",
      entityType: "PRICING_RULE",
      entityId: ruleId,
      metadata: {
        status: existing.status,
        model: existing.model,
        version: existing.version,
        changeReason: existing.changeReason
      }
    });

    return { id: ruleId };
  }

  async archive(user: AuthUser, ruleId: string, input?: { reason?: string }) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const row = await prisma.creditPricingRule.update({
      where: { id: ruleId },
      data: {
        status: "ARCHIVED",
        enabled: false,
        archivedAt: new Date(),
        endsAt: new Date()
      },
      include: { aiModel: { select: { displayName: true } } }
    });

    creditPricingService.invalidateQuoteCache();

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "pricing_rule.archived",
      entityType: "PRICING_RULE",
      entityId: row.id,
      metadata: { reason: input?.reason ?? null }
    });

    return serializeAdminPricingRule(row);
  }

  async simulate(
    user: AuthUser,
    input: {
      type: GenerationType;
      model: string;
      parameters: Record<string, unknown>;
      draftRuleId?: string;
    }
  ) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const currentQuote = await creditPricingService.quoteGeneration({
      type: input.type,
      model: input.model,
      parameters: input.parameters
    });

    let draftQuote = null;
    if (input.draftRuleId) {
      const draftRule = await prisma.creditPricingRule.findUnique({ where: { id: input.draftRuleId } });
      if (draftRule) {
        const matched = await creditPricingRepository.findBestMatchingRule({
          type: input.type,
          model: input.model,
          parameters: input.parameters,
          includeStatuses: ["DRAFT", "VALIDATED", "PUBLISHED"],
          preferredRuleId: draftRule.id
        });
        if (matched?.id === draftRule.id) {
          const outputCount = Math.max(
            1,
            Number(input.parameters.outputs ?? input.parameters.outputCount ?? 1)
          );
          const credits = Math.max(1, matched.creditPrice * outputCount);
          const margins = await computePricingMargins({
            creditPrice: matched.creditPrice,
            providerCostMinor: matched.providerCostMinor,
            outputCount
          });
          draftQuote = {
            ruleId: matched.id,
            version: matched.version,
            credits,
            providerCostMinor: matched.providerCostMinor,
            marginAmountMinor: margins.marginAmountMinor,
            marginPercent: margins.marginPercent
          };
        }
      }
    }

    const deltaCredits = draftQuote ? draftQuote.credits - currentQuote.credits : 0;
    const deltaPercent =
      currentQuote.credits > 0 ? Math.round((deltaCredits / currentQuote.credits) * 1000) / 10 : null;

    return {
      current: currentQuote,
      draft: draftQuote,
      deltaCredits,
      deltaPercent
    };
  }
}

export const adminPricingRuleService = new AdminPricingRuleService();
