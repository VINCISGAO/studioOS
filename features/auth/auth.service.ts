import { headers } from "next/headers";
import { DEMO_USERS, findDemoUser, type DemoUser } from "@/lib/demo-auth";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { userRepository, type UserWithProfiles } from "@/features/auth/user.repository";
import type { UserRole } from "@prisma/client";

export type AuthUserDto = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  companyName?: string;
  displayName?: string;
};

function mapPrismaUser(user: UserWithProfiles): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    companyName: user.brandProfile?.companyName,
    displayName: user.creatorProfile?.displayName ?? undefined
  };
}

function demoRoleToPrisma(role: DemoUser["role"]): UserRole {
  if (role === "admin") return "ADMIN";
  if (role === "creator") return "CREATOR";
  return "BRAND";
}

export class AuthService {
  async authenticate(email: string, password: string): Promise<AuthUserDto | null> {
    const normalized = email.trim().toLowerCase();

    if (hasDatabaseUrl()) {
      const user = await userRepository.findByEmail(normalized);
      if (user?.passwordHash) {
        const { verifyPassword } = await import("@/lib/core/password");
        if (verifyPassword(password, user.passwordHash)) {
          const headerList = await headers();
          await userRepository.touchLogin(user.id, {
            ip:
              headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
              headerList.get("x-real-ip") ??
              undefined,
            device: headerList.get("user-agent") ?? undefined
          });
          return mapPrismaUser(user);
        }
      }
    }

    const demo = findDemoUser(normalized, password);
    if (!demo) return null;

    if (hasDatabaseUrl()) {
      const synced = await userRepository.findByEmail(normalized);
      if (synced) {
        await userRepository.touchLogin(synced.id);
        return mapPrismaUser(synced);
      }
    }

    return {
      id: `demo_${normalized.replace(/[^a-z0-9]/gi, "_")}`,
      email: demo.email,
      role: demoRoleToPrisma(demo.role),
      fullName: demo.label,
      companyName: demo.role === "client" ? demo.label : undefined,
      displayName: demo.role === "creator" ? demo.label : undefined
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
        fullName: demo.label
      };
    }

    if (!hasDatabaseUrl()) return null;
    const user = await userRepository.findById(id);
    return user ? mapPrismaUser(user) : null;
  }

  prismaRoleToDemoTab(role: UserRole): "brand" | "creator" | "admin" {
    if (role === "CREATOR") return "creator";
    if (role === "ADMIN" || role === "SUPPORT" || role === "SYSTEM") return "admin";
    return "brand";
  }
}

export const authService = new AuthService();
