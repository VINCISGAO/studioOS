import "server-only";

import type { UserRole } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/core/database/prisma";
import type { UserWithProfiles } from "@/features/auth/user.repository";

export class UserOAuthRepository {
  async findLinkedUser(provider: string, providerUserId: string): Promise<UserWithProfiles | null> {
    if (!hasDatabaseUrl()) return null;

    const row = await prisma.userOAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId
        }
      },
      include: {
        user: {
          include: { brandProfile: true, creatorProfile: true }
        }
      }
    });

    if (!row?.user || row.user.deletedAt) return null;
    return row.user;
  }

  async linkAccount(input: { userId: string; provider: string; providerUserId: string }) {
    if (!hasDatabaseUrl()) return;

    await prisma.userOAuthAccount.upsert({
      where: {
        provider_providerUserId: {
          provider: input.provider,
          providerUserId: input.providerUserId
        }
      },
      create: {
        userId: input.userId,
        provider: input.provider,
        providerUserId: input.providerUserId
      },
      update: {
        userId: input.userId
      }
    });
  }

  async createUserWithOAuth(input: {
    provider: string;
    providerUserId: string;
    email: string;
    role: UserRole;
    fullName: string;
  }): Promise<UserWithProfiles> {
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        role: input.role,
        fullName: input.fullName,
        passwordHash: null,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        oauthAccounts: {
          create: {
            provider: input.provider,
            providerUserId: input.providerUserId
          }
        },
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
}

export const userOAuthRepository = new UserOAuthRepository();
