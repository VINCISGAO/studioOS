import type { AiModelCategory, GenerationType, Prisma } from "@prisma/client";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { creditPlatformAuditService } from "@/features/admin/credits/credit-platform-audit.service";
import { creditPricingIntegrityService } from "@/features/credit-wallet/credit-pricing-integrity.service";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function assertPricingRulesForModel(internalModelId: string) {
  const count = await prisma.creditPricingRule.count({
    where: { model: internalModelId, status: "PUBLISHED", enabled: true }
  });
  if (count === 0) {
    throw appError(
      "VALIDATION_ERROR",
      `Cannot enable model without at least one pricing rule: ${internalModelId}`
    );
  }
}

export class AdminAiModelService {
  private assertAccess(user: AuthUser) {
    PermissionService.assert(user, "admin.wallet.manage");
    if (!hasDatabaseUrl()) return false;
    return true;
  }

  async list(user: AuthUser, filters?: { category?: AiModelCategory; q?: string; enabled?: boolean }) {
    if (!this.assertAccess(user)) return [];
    const where: Prisma.AiModelWhereInput = { deletedAt: null };
    if (filters?.category) where.category = filters.category;
    if (typeof filters?.enabled === "boolean") where.enabled = filters.enabled;
    if (filters?.q?.trim()) {
      where.OR = [
        { displayName: { contains: filters.q, mode: "insensitive" } },
        { internalModelId: { contains: filters.q, mode: "insensitive" } },
        { provider: { contains: filters.q, mode: "insensitive" } }
      ];
    }

    const rows = await prisma.aiModel.findMany({
      where,
      include: {
        pricingRules: {
          where: { status: "PUBLISHED", enabled: true },
          orderBy: [{ sortOrder: "asc" }, { creditPrice: "asc" }]
        }
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }]
    });

    return rows.map((row) => ({
      id: row.id,
      internalModelId: row.internalModelId,
      displayName: row.displayName,
      provider: row.provider,
      category: row.category,
      generationType: row.generationType,
      logoUrl: row.logoUrl,
      description: row.description,
      enabled: row.enabled,
      recommended: row.recommended,
      isDefault: row.isDefault,
      sortOrder: row.sortOrder,
      baseCreditPrice: row.baseCreditPrice,
      providerCostMinor: row.providerCostMinor,
      marginPercent: row.marginPercent,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      pricingRuleCount: row.pricingRules.length,
      pricingRules: row.pricingRules.map((rule) => ({
        id: rule.id,
        mode: rule.mode,
        label: rule.label,
        durationSec: rule.durationSec,
        resolution: rule.resolution,
        creditPrice: rule.creditPrice,
        providerCostMinor: rule.providerCostMinor,
        marginPercent: rule.marginPercent,
        enabled: rule.enabled
      }))
    }));
  }

  async get(user: AuthUser, modelId: string) {
    if (!this.assertAccess(user)) return null;
    const row = await prisma.aiModel.findFirst({
      where: { id: modelId, deletedAt: null },
      include: { pricingRules: { orderBy: [{ sortOrder: "asc" }] } }
    });
    if (!row) return null;
    const audit = await creditPlatformAuditService.list({
      entityType: "AI_MODEL",
      entityId: row.id,
      limit: 20
    });
    return { model: row, audit };
  }

  async create(
    user: AuthUser,
    input: {
      internalModelId: string;
      displayName: string;
      provider: string;
      category: AiModelCategory;
      generationType: GenerationType;
      logoUrl?: string | null;
      description?: string | null;
      enabled?: boolean;
      recommended?: boolean;
      isDefault?: boolean;
      sortOrder?: number;
      baseCreditPrice?: number | null;
      providerCostMinor?: number | null;
      marginPercent?: number | null;
      startsAt?: string | null;
      endsAt?: string | null;
    }
  ) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    if (input.enabled) {
      await assertPricingRulesForModel(input.internalModelId);
    }

    const row = await prisma.aiModel.create({
      data: {
        internalModelId: slugify(input.internalModelId),
        displayName: input.displayName,
        provider: input.provider,
        category: input.category,
        generationType: input.generationType,
        logoUrl: input.logoUrl ?? null,
        description: input.description ?? null,
        enabled: input.enabled ?? false,
        recommended: input.recommended ?? false,
        isDefault: input.isDefault ?? false,
        sortOrder: input.sortOrder ?? 0,
        baseCreditPrice: input.baseCreditPrice ?? null,
        providerCostMinor: input.providerCostMinor ?? null,
        marginPercent: input.marginPercent ?? null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null
      }
    });

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "ai_model.created",
      entityType: "AI_MODEL",
      entityId: row.id,
      metadata: { internalModelId: row.internalModelId, displayName: row.displayName }
    });

    return row;
  }

  async update(
    user: AuthUser,
    modelId: string,
    input: Partial<{
      displayName: string;
      provider: string;
      category: AiModelCategory;
      generationType: GenerationType;
      logoUrl: string | null;
      description: string | null;
      enabled: boolean;
      recommended: boolean;
      isDefault: boolean;
      sortOrder: number;
      baseCreditPrice: number | null;
      providerCostMinor: number | null;
      marginPercent: number | null;
      startsAt: string | null;
      endsAt: string | null;
    }>
  ) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const existing = await prisma.aiModel.findFirst({ where: { id: modelId, deletedAt: null } });
    if (!existing) throw appError("NOT_FOUND", "AI model not found");

    if (input.enabled === true) {
      await assertPricingRulesForModel(existing.internalModelId);
    }

    const row = await prisma.aiModel.update({
      where: { id: modelId },
      data: {
        displayName: input.displayName,
        provider: input.provider,
        category: input.category,
        generationType: input.generationType,
        logoUrl: input.logoUrl,
        description: input.description,
        enabled: input.enabled,
        recommended: input.recommended,
        isDefault: input.isDefault,
        sortOrder: input.sortOrder,
        baseCreditPrice: input.baseCreditPrice,
        providerCostMinor: input.providerCostMinor,
        marginPercent: input.marginPercent,
        startsAt: input.startsAt === undefined ? undefined : input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt === undefined ? undefined : input.endsAt ? new Date(input.endsAt) : null
      }
    });

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "ai_model.updated",
      entityType: "AI_MODEL",
      entityId: row.id,
      metadata: input as Record<string, unknown>
    });

    return row;
  }

  async softDelete(user: AuthUser, modelId: string) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const row = await prisma.aiModel.update({
      where: { id: modelId },
      data: { enabled: false, deletedAt: new Date() }
    });
    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "ai_model.deleted",
      entityType: "AI_MODEL",
      entityId: row.id,
      metadata: { internalModelId: row.internalModelId }
    });
    return row;
  }

  async getPricingHealth(user: AuthUser) {
    if (!this.assertAccess(user)) {
      return { healthy: true, checkedAt: new Date().toISOString(), enabledModelCount: 0, ruleCount: 0, issues: [], models: [] };
    }
    return creditPricingIntegrityService.getReport();
  }
}

export const adminAiModelService = new AdminAiModelService();
