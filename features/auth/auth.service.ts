import { DEMO_USERS, findDemoUser, type DemoUser } from "@/lib/demo-auth";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { hashPassword, verifyPassword } from "@/lib/core/password-crypto";
import { readRequestMeta } from "@/lib/core/request-meta";
import { userRepository, type UserWithProfiles } from "@/features/auth/user.repository";
import type { UserRole } from "@prisma/client";

export type AuthUserDto = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  languageCode: string;
  companyName?: string;
  displayName?: string;
  hasBrandProfile: boolean;
  hasCreatorProfile: boolean;
};

function mapPrismaUser(user: UserWithProfiles): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    languageCode: user.languageCode ?? user.language ?? "en",
    companyName: user.brandProfile?.companyName,
    displayName: user.creatorProfile?.displayName ?? undefined,
    hasBrandProfile: user.role === "BRAND" || Boolean(user.brandProfile),
    hasCreatorProfile: user.role === "CREATOR" || Boolean(user.creatorProfile)
  };
}

function demoRoleToPrisma(role: DemoUser["role"]): UserRole {
  if (role === "admin") return "ADMIN";
  if (role === "creator") return "CREATOR";
  return "BRAND";
}

const weakPasswords = new Set(["12345678", "123456789", "password", "password1", "qwerty123"]);

function isStrongPassword(password: string) {
  const normalized = password.trim().toLowerCase();
  return (
    password.length >= 8 &&
    !/^\d+$/.test(password) &&
    /[a-z]/i.test(password) &&
    /\d/.test(password) &&
    !weakPasswords.has(normalized)
  );
}

export class AuthService {
  async register(input: {
    email: string;
    password: string;
    role: UserRole;
    fullName: string;
    companyName?: string;
    displayName?: string;
  }): Promise<{ ok: true; user: AuthUserDto } | { ok: false; error: "invalid" | "email-taken" | "database-unavailable" }> {
    if (!hasDatabaseUrl()) {
      return { ok: false, error: "database-unavailable" };
    }

    const normalized = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim() || normalized.split("@")[0] || "VINCIS User";
    if (!normalized.includes("@") || !isStrongPassword(input.password)) {
      return { ok: false, error: "invalid" };
    }

    const existing = await userRepository.findByEmail(normalized);
    if (existing) {
      if (
        existing.role === "ADMIN" ||
        existing.role === "SUPPORT" ||
        existing.role === "SYSTEM" ||
        !existing.passwordHash ||
        !verifyPassword(input.password, existing.passwordHash)
      ) {
        return { ok: false, error: "email-taken" };
      }

      if (input.role === "BRAND") {
        if (existing.brandProfile) {
          return { ok: false, error: "email-taken" };
        }

        const user = await userRepository.ensureBrandProfileForUser({
          userId: existing.id,
          companyName: input.companyName ?? fullName
        });
        return { ok: true, user: mapPrismaUser(user) };
      }

      if (input.role === "CREATOR") {
        if (existing.creatorProfile) {
          return { ok: false, error: "email-taken" };
        }

        const user = await userRepository.ensureCreatorProfileForUser({
          userId: existing.id,
          displayName: input.displayName ?? fullName
        });
        const { membershipService } = await import("@/features/membership/membership.service");
        await membershipService.ensureDefaultMembershipOnCreatorRegister(
          user.id,
          user.creatorProfile?.id
        );
        return { ok: true, user: mapPrismaUser(user) };
      }

      return { ok: false, error: "email-taken" };
    }

    const user = await userRepository.createWithPassword({
      email: normalized,
      role: input.role,
      fullName,
      passwordHash: hashPassword(input.password),
      companyName: input.companyName,
      displayName: input.displayName
    });

    return { ok: true, user: mapPrismaUser(user) };
  }

  async authenticate(email: string, password: string): Promise<AuthUserDto | null> {
    const normalized = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (hasDatabaseUrl()) {
      try {
        const user = await userRepository.findByEmail(normalized);
        if (user?.passwordHash && verifyPassword(normalizedPassword, user.passwordHash)) {
          const meta = await readRequestMeta();
          await userRepository.touchLogin(user.id, {
            ip: meta.ip ?? undefined,
            device: meta.device ?? undefined
          });
          return mapPrismaUser(user);
        }
      } catch {
        // Fall through to demo password check when DB is unavailable.
      }
    }

    const demo = findDemoUser(normalized, normalizedPassword);
    if (!demo) return null;

    if (hasDatabaseUrl()) {
      try {
        const synced = await userRepository.findByEmail(normalized);
        if (synced) {
          const expectedRole = demoRoleToPrisma(demo.role);
          const hashMatches =
            Boolean(synced.passwordHash) &&
            verifyPassword(normalizedPassword, synced.passwordHash);
          const roleMatches = synced.role === expectedRole;

          if (!hashMatches || !roleMatches) {
            const refreshed = await userRepository.upsertDemoUser({
              email: normalized,
              role: expectedRole,
              fullName: demo.label,
              passwordHash: hashPassword(normalizedPassword),
              companyName: demo.role === "client" ? demo.label : undefined,
              displayName: demo.role === "creator" ? demo.label : undefined
            });
            await userRepository.touchLogin(refreshed.id);
            return mapPrismaUser(refreshed);
          }

          await userRepository.touchLogin(synced.id);
          return mapPrismaUser(synced);
        }

        const created = await userRepository.upsertDemoUser({
          email: normalized,
          role: demoRoleToPrisma(demo.role),
          fullName: demo.label,
          passwordHash: hashPassword(normalizedPassword),
          companyName: demo.role === "client" ? demo.label : undefined,
          displayName: demo.role === "creator" ? demo.label : undefined
        });
        await userRepository.touchLogin(created.id);
        return mapPrismaUser(created);
      } catch {
        // Fall through to in-memory demo user when DB is unavailable.
      }
    }

    return {
      id: `demo_${normalized.replace(/[^a-z0-9]/gi, "_")}`,
      email: demo.email,
      role: demoRoleToPrisma(demo.role),
      fullName: demo.label,
      languageCode: "en",
      companyName: demo.role === "client" ? demo.label : undefined,
      displayName: demo.role === "creator" ? demo.label : undefined,
      hasBrandProfile: demo.role === "client",
      hasCreatorProfile: demo.role === "creator"
    };
  }

  async getUserById(id: string): Promise<AuthUserDto | null> {
    if (id.startsWith("demo_")) {
      const email = id.replace(/^demo_/, "").replace(/_/g, ".");
      const demo = DEMO_USERS.find((u) => u.email.includes(email.split(".")[0] ?? ""));
      if (!demo) return null;
      return {
        id,
        email: demo.email,
        role: demoRoleToPrisma(demo.role),
        fullName: demo.label,
        languageCode: "en",
        companyName: demo.role === "client" ? demo.label : undefined,
        displayName: demo.role === "creator" ? demo.label : undefined,
        hasBrandProfile: demo.role === "client",
        hasCreatorProfile: demo.role === "creator"
      };
    }

    if (!hasDatabaseUrl()) return null;
    const user = await userRepository.findById(id);
    return user ? mapPrismaUser(user) : null;
  }

  async getUserByEmail(email: string): Promise<AuthUserDto | null> {
    if (!hasDatabaseUrl()) return null;
    const user = await userRepository.findByEmail(email.trim().toLowerCase());
    return user ? mapPrismaUser(user) : null;
  }

  prismaRoleToDemoTab(role: UserRole): "brand" | "creator" | "admin" {
    if (role === "CREATOR") return "creator";
    if (role === "ADMIN" || role === "SUPPORT" || role === "SYSTEM") return "admin";
    return "brand";
  }
}

export const authService = new AuthService();
