import type { UserRole } from "@prisma/client";
import type { AuthUserDto } from "@/features/auth/auth.service";
import { authService } from "@/features/auth/auth.service";
import { userRepository, type UserWithProfiles } from "@/features/auth/user.repository";
import { getSessionUser } from "@/features/auth/session.service";
import { hashPassword } from "@/lib/core/password-crypto";
import { appError } from "@/lib/core/errors";
import { enforceApiRateLimit } from "@/lib/core/security/rate-limit.service";
import { DEMO_PASSWORD, DEMO_USERS, type DemoUser } from "@/lib/demo-auth";

function demoEmailFromId(id: string) {
  return id.replace(/^demo_/, "").replace(/_/g, ".");
}

function demoRoleToPrisma(role: DemoUser["role"]): UserRole {
  if (role === "creator") return "CREATOR";
  if (role === "admin") return "ADMIN";
  return "BRAND";
}

function mapUser(user: UserWithProfiles): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    languageCode: user.languageCode ?? user.language ?? "en",
    companyName: user.brandProfile?.companyName,
    displayName: user.creatorProfile?.displayName ?? undefined
  };
}

export async function requireAiCopilotUser(request?: Request): Promise<AuthUserDto> {
  if (request) {
    const pathname = new URL(request.url).pathname;
    await enforceApiRateLimit(request, pathname);
  }

  const user = await getSessionUser();
  if (!user) {
    throw appError("UNAUTHORIZED", "Not authenticated");
  }

  if (!user.id.startsWith("demo_")) {
    return user;
  }

  try {
    const syncedByEmail = await authService.getUserByEmail(user.email);
    const synced = syncedByEmail ?? (await authService.getUserByEmail(demoEmailFromId(user.id)));
    if (synced && !synced.id.startsWith("demo_")) {
      return synced;
    }

    const demo = DEMO_USERS.find((item) => item.email === user.email || item.email === demoEmailFromId(user.id));
    if (!demo) {
      throw appError("UNAUTHORIZED", "请使用数据库账号登录后再使用 StudioOS AI。");
    }

    const created = await userRepository.upsertDemoUser({
      email: demo.email,
      role: demoRoleToPrisma(demo.role),
      fullName: demo.label,
      passwordHash: hashPassword(DEMO_PASSWORD),
      companyName: demo.role === "client" ? demo.label : undefined,
      displayName: demo.role === "creator" ? demo.label : undefined
    });

    return mapUser(created);
  } catch (error) {
    if (error instanceof Error && error.name === "AppError") throw error;
    throw appError("SYSTEM_ERROR", "AI 数据库连接失败。请确认本地 PostgreSQL 已启动，并重启 npm run dev:fix。");
  }
}
