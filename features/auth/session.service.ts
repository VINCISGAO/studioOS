import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { type DemoSession } from "@/lib/demo-session";
import { parseServerDemoSession } from "@/lib/demo-session-server";
import { authService, type AuthUserDto } from "@/features/auth/auth.service";
import type { MvpProfile, MvpRole } from "@/lib/mvp/types";
import type { UserRole } from "@prisma/client";
import { isPlatformAdminUserRole } from "@/lib/auth/platform-admin-guard";

export function prismaRoleToMvp(role: UserRole): MvpRole {
  if (role === "CREATOR") return "studio";
  if (role === "ADMIN" || role === "SUPPORT" || role === "SYSTEM") return "admin";
  return "brand";
}

function demoRoleToPrisma(role: DemoSession["role"]): UserRole {
  if (role === "creator") return "CREATOR";
  if (role === "admin") return "ADMIN";
  return "BRAND";
}

function authUserFromDemoSession(session: DemoSession): AuthUserDto {
  return {
    id: session.userId ?? `demo_${session.email.replace(/[^a-z0-9]/gi, "_")}`,
    email: session.email,
    role: demoRoleToPrisma(session.role),
    fullName: session.email,
    languageCode: "en",
    hasBrandProfile: session.role === "client",
    hasCreatorProfile: session.role === "creator"
  };
}

export async function getSessionUser(): Promise<AuthUserDto | null> {
  const cookieStore = await cookies();
  const session = parseServerDemoSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session || session.role === "admin") return null;

  try {
    if (session.userId) {
      const user = await authService.getUserById(session.userId);
      if (
        user &&
        user.email.toLowerCase() === session.email.toLowerCase() &&
        !isPlatformAdminUserRole(user.role)
      ) {
        return user;
      }
    }

    const byEmail = await authService.getUserByEmail(session.email);
    if (byEmail && !isPlatformAdminUserRole(byEmail.role)) return byEmail;

    const demoUser = await authService.getUserById(`demo_${session.email.replace(/[^a-z0-9]/gi, "_")}`);
    if (demoUser && !isPlatformAdminUserRole(demoUser.role)) return demoUser;
  } catch {
    // DB unavailable — fall back to cookie session so workspace UI (incl. AI floater) stays usable.
  }

  return authUserFromDemoSession(session);
}

export async function getSessionMvpProfile(): Promise<MvpProfile | null> {
  const user = await getSessionUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: prismaRoleToMvp(user.role),
    name: user.displayName ?? user.companyName ?? user.fullName,
    company_name: user.companyName ?? user.fullName,
    created_at: new Date().toISOString()
  };
}

export function buildSessionPayload(user: AuthUserDto, demoRole: DemoSession["role"]): DemoSession {
  return {
    email: user.email,
    role: demoRole,
    userId: user.id.startsWith("demo_") ? undefined : user.id
  };
}
