import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession, type DemoSession } from "@/lib/demo-session";
import { authService, type AuthUserDto } from "@/features/auth/auth.service";
import type { MvpProfile, MvpRole } from "@/lib/mvp/types";
import type { UserRole } from "@prisma/client";

export function prismaRoleToMvp(role: UserRole): MvpRole {
  if (role === "CREATOR") return "studio";
  if (role === "ADMIN" || role === "SUPPORT" || role === "SYSTEM") return "admin";
  return "brand";
}

export async function getSessionUser(): Promise<AuthUserDto | null> {
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  if (!session) return null;

  if (session.userId) {
    const user = await authService.getUserById(session.userId);
    if (user) return user;
  }

  return authService.getUserById(session.userId ?? `demo_${session.email.replace(/[^a-z0-9]/gi, "_")}`);
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
