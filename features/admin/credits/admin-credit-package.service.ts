import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { creditPlatformAuditService } from "@/features/admin/credits/credit-platform-audit.service";
import { serializeCreditPackage } from "@/features/credit-wallet/credit-wallet.serializer";
import { appError } from "@/lib/core/errors";
import { hasDatabaseUrl, prisma } from "@/lib/core/database/prisma";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function serializeAdminPackage(row: {
  id: string;
  name: string;
  slug: string | null;
  version: number;
  versionLabel: string | null;
  credits: number;
  bonusCredits: number;
  currency: string;
  amountMinor: number;
  regionCodes: string[];
  membershipTier: string | null;
  visible: boolean;
  isDefault: boolean;
  enabled: boolean;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  deletedAt: Date | null;
  duplicatedFromId: string | null;
  createdAt: Date;
  updatedAt: Date;
  regionalPrices?: Array<{
    id: string;
    currency: string;
    amountMinor: number;
    regionCode: string | null;
    enabled: boolean;
  }>;
}) {
  return {
    ...serializeCreditPackage(row),
    slug: row.slug,
    version: row.version,
    versionLabel: row.versionLabel,
    regionCodes: row.regionCodes,
    membershipTier: row.membershipTier,
    visible: row.visible,
    isDefault: row.isDefault,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    duplicatedFromId: row.duplicatedFromId,
    regionalPrices: row.regionalPrices ?? []
  };
}

export class AdminCreditPackageService {
  private assertAccess(user: AuthUser) {
    PermissionService.assert(user, "admin.wallet.manage");
    if (!hasDatabaseUrl()) return false;
    return true;
  }

  async list(
    user: AuthUser,
    filters?: { q?: string; enabled?: boolean; includeDeleted?: boolean; region?: string }
  ) {
    if (!this.assertAccess(user)) return [];
    const where: Prisma.CreditPackageWhereInput = {};
    if (!filters?.includeDeleted) where.deletedAt = null;
    if (typeof filters?.enabled === "boolean") where.enabled = filters.enabled;
    if (filters?.region) where.regionCodes = { has: filters.region };
    if (filters?.q?.trim()) {
      where.OR = [
        { name: { contains: filters.q, mode: "insensitive" } },
        { slug: { contains: filters.q, mode: "insensitive" } },
        { versionLabel: { contains: filters.q, mode: "insensitive" } }
      ];
    }

    const rows = await prisma.creditPackage.findMany({
      where,
      include: { regionalPrices: { where: { enabled: true } } },
      orderBy: [{ sortOrder: "asc" }, { credits: "asc" }]
    });
    return rows.map(serializeAdminPackage);
  }

  async get(user: AuthUser, packageId: string) {
    if (!this.assertAccess(user)) return null;
    const row = await prisma.creditPackage.findFirst({
      where: { id: packageId, deletedAt: null },
      include: { regionalPrices: true }
    });
    if (!row) return null;
    const audit = await creditPlatformAuditService.list({
      entityType: "CREDIT_PACKAGE",
      entityId: row.id,
      limit: 20
    });
    return { package: serializeAdminPackage(row), audit };
  }

  async preview(user: AuthUser, packageId: string) {
    const detail = await this.get(user, packageId);
    if (!detail) throw appError("NOT_FOUND", "Credit package not found");
    return {
      ...detail.package,
      totalCredits: detail.package.credits + detail.package.bonusCredits,
      previewAt: new Date().toISOString()
    };
  }

  async create(
    user: AuthUser,
    input: {
      name: string;
      slug?: string;
      version?: number;
      versionLabel?: string | null;
      credits: number;
      bonusCredits?: number;
      currency?: string;
      amountMinor: number;
      regionCodes?: string[];
      membershipTier?: string | null;
      visible?: boolean;
      isDefault?: boolean;
      enabled?: boolean;
      sortOrder?: number;
      startsAt?: string | null;
      endsAt?: string | null;
      regionalPrices?: Array<{ currency: string; amountMinor: number; regionCode?: string | null; enabled?: boolean }>;
    }
  ) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.creditPackage.create({
        data: {
          name: input.name,
          slug: slugify(input.slug ?? input.name),
          version: input.version ?? 1,
          versionLabel: input.versionLabel ?? null,
          credits: input.credits,
          bonusCredits: input.bonusCredits ?? 0,
          currency: (input.currency ?? "USD").toUpperCase(),
          amountMinor: input.amountMinor,
          regionCodes: input.regionCodes ?? [],
          membershipTier: input.membershipTier ?? null,
          visible: input.visible ?? true,
          isDefault: input.isDefault ?? false,
          enabled: input.enabled ?? true,
          sortOrder: input.sortOrder ?? 0,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null
        }
      });

      if (input.regionalPrices?.length) {
        await tx.creditPackageRegionalPrice.createMany({
          data: input.regionalPrices.map((price) => ({
            packageId: created.id,
            currency: price.currency.toUpperCase(),
            amountMinor: price.amountMinor,
            regionCode: price.regionCode ?? "GLOBAL",
            enabled: price.enabled ?? true
          }))
        });
      }

      return tx.creditPackage.findUniqueOrThrow({
        where: { id: created.id },
        include: { regionalPrices: true }
      });
    });

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "credit_package.created",
      entityType: "CREDIT_PACKAGE",
      entityId: row.id,
      metadata: { name: row.name, slug: row.slug, version: row.version }
    });

    return serializeAdminPackage(row);
  }

  async duplicate(user: AuthUser, packageId: string, input?: { name?: string; versionLabel?: string }) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const source = await prisma.creditPackage.findFirst({
      where: { id: packageId, deletedAt: null },
      include: { regionalPrices: true }
    });
    if (!source) throw appError("NOT_FOUND", "Credit package not found");

    return this.create(user, {
      name: input?.name ?? `${source.name} Copy`,
      slug: `${source.slug ?? slugify(source.name)}-v${source.version + 1}`,
      version: source.version + 1,
      versionLabel: input?.versionLabel ?? `${source.versionLabel ?? source.name} V${source.version + 1}`,
      credits: source.credits,
      bonusCredits: source.bonusCredits,
      currency: source.currency,
      amountMinor: source.amountMinor,
      regionCodes: source.regionCodes,
      membershipTier: source.membershipTier,
      visible: false,
      isDefault: false,
      enabled: false,
      sortOrder: source.sortOrder + 1,
      startsAt: source.startsAt?.toISOString() ?? null,
      endsAt: source.endsAt?.toISOString() ?? null,
        regionalPrices: source.regionalPrices.map((price) => ({
          currency: price.currency,
          amountMinor: price.amountMinor,
          regionCode: price.regionCode,
          bonusCredits: price.bonusCredits,
          stripePriceId: price.stripePriceId,
          enabled: price.enabled,
          startsAt: price.startsAt?.toISOString() ?? null,
          endsAt: price.endsAt?.toISOString() ?? null,
          taxBehavior: price.taxBehavior
        }))
    }).then(async (created) => {
      await prisma.creditPackage.update({
        where: { id: created.id },
        data: { duplicatedFromId: source.id }
      });
      return { ...created, duplicatedFromId: source.id };
    });
  }

  async update(
    user: AuthUser,
    packageId: string,
    input: Partial<{
      name: string;
      slug: string;
      version: number;
      versionLabel: string | null;
      credits: number;
      bonusCredits: number;
      currency: string;
      amountMinor: number;
      regionCodes: string[];
      membershipTier: string | null;
      visible: boolean;
      isDefault: boolean;
      enabled: boolean;
      sortOrder: number;
      startsAt: string | null;
      endsAt: string | null;
    }>
  ) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const existing = await prisma.creditPackage.findFirst({ where: { id: packageId, deletedAt: null } });
    if (!existing) throw appError("NOT_FOUND", "Credit package not found");

    const row = await prisma.creditPackage.update({
      where: { id: packageId },
      data: {
        name: input.name,
        slug: input.slug ? slugify(input.slug) : undefined,
        version: input.version,
        versionLabel: input.versionLabel,
        credits: input.credits,
        bonusCredits: input.bonusCredits,
        currency: input.currency?.toUpperCase(),
        amountMinor: input.amountMinor,
        regionCodes: input.regionCodes,
        membershipTier: input.membershipTier,
        visible: input.visible,
        isDefault: input.isDefault,
        enabled: input.enabled,
        sortOrder: input.sortOrder,
        startsAt: input.startsAt === undefined ? undefined : input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt === undefined ? undefined : input.endsAt ? new Date(input.endsAt) : null
      },
      include: { regionalPrices: true }
    });

    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "credit_package.updated",
      entityType: "CREDIT_PACKAGE",
      entityId: row.id,
      metadata: input as Record<string, unknown>
    });

    return serializeAdminPackage(row);
  }

  async softDelete(user: AuthUser, packageId: string) {
    if (!this.assertAccess(user)) throw appError("SYSTEM_ERROR", "Database unavailable");
    const row = await prisma.creditPackage.update({
      where: { id: packageId },
      data: { enabled: false, visible: false, deletedAt: new Date() },
      include: { regionalPrices: true }
    });
    await creditPlatformAuditService.write({
      actorUserId: user.id,
      action: "credit_package.deleted",
      entityType: "CREDIT_PACKAGE",
      entityId: row.id,
      metadata: { name: row.name }
    });
    return serializeAdminPackage(row);
  }
}

export const adminCreditPackageService = new AdminCreditPackageService();
