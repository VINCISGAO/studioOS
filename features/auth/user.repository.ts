import type { User, UserRole, BrandProfile, CreatorProfile } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";

export type UserWithProfiles = User & {
  brandProfile: BrandProfile | null;
  creatorProfile: CreatorProfile | null;
};

export class UserRepository {
  async findByEmail(email: string): Promise<UserWithProfiles | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { brandProfile: true, creatorProfile: true }
    });
  }

  async findById(id: string): Promise<UserWithProfiles | null> {
    if (!hasDatabaseUrl()) return null;
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { brandProfile: true, creatorProfile: true }
    });
  }

  async upsertDemoUser(input: {
    email: string;
    role: UserRole;
    fullName: string;
    passwordHash: string;
    companyName?: string;
    displayName?: string;
  }): Promise<UserWithProfiles> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: input.fullName,
          passwordHash: input.passwordHash,
          role: input.role,
          lastLoginAt: new Date()
        },
        include: { brandProfile: true, creatorProfile: true }
      });
    }

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        role: input.role,
        fullName: input.fullName,
        passwordHash: input.passwordHash,
        emailVerified: true,
        ...(input.role === "BRAND"
          ? {
              brandProfile: {
                create: { companyName: input.companyName ?? input.fullName }
              }
            }
          : {}),
        ...(input.role === "CREATOR"
          ? {
              creatorProfile: {
                create: { displayName: input.displayName ?? input.fullName }
              }
            }
          : {}),
        ...(input.role === "ADMIN" ? {} : {})
      },
      include: { brandProfile: true, creatorProfile: true }
    });

    if (input.role === "CREATOR") {
      const { membershipService } = await import("@/features/membership/membership.service");
      await membershipService.ensureDefaultMembershipOnCreatorRegister(
        user.id,
        user.creatorProfile?.id
      );
    }

    return user;
  }

  async createFromOAuth(input: {
    email: string;
    role: UserRole;
    fullName: string;
  }): Promise<UserWithProfiles> {
    const existing = await this.findByEmail(input.email);
    if (existing) {
      return existing;
    }

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        role: input.role,
        fullName: input.fullName,
        passwordHash: null,
        emailVerified: true,
        ...(input.role === "BRAND"
          ? {
              brandProfile: {
                create: { companyName: input.fullName }
              }
            }
          : {}),
        ...(input.role === "CREATOR"
          ? {
              creatorProfile: {
                create: { displayName: input.fullName }
              }
            }
          : {})
      },
      include: { brandProfile: true, creatorProfile: true }
    });

    if (input.role === "CREATOR") {
      const { membershipService } = await import("@/features/membership/membership.service");
      await membershipService.ensureDefaultMembershipOnCreatorRegister(
        user.id,
        user.creatorProfile?.id
      );
    }

    return user;
  }

  async touchLogin(userId: string, meta?: { ip?: string; device?: string }) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
    await prisma.sessionLog.create({
      data: {
        userId,
        ip: meta?.ip,
        device: meta?.device
      }
    });
  }
}

export const userRepository = new UserRepository();
