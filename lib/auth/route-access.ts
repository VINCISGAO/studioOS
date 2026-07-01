import type { DemoRole } from "@/lib/demo-session";
import type { UserRole } from "@prisma/client";

/** Normalize DB / Supabase / demo role strings to portal routing roles. */
export function normalizeRouteRole(raw: string | null | undefined): DemoRole | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (value === "admin" || value === "system" || value === "support") return "admin";
  if (value === "creator" || value === "studio") return "creator";
  if (value === "client" || value === "brand") return "client";
  return null;
}

export function isAdminRouteRole(role: DemoRole | string | null | undefined): boolean {
  return normalizeRouteRole(typeof role === "string" ? role : role ?? null) === "admin";
}

export function isPrismaAdminRole(role: UserRole | string): boolean {
  const upper = role.toString().toUpperCase();
  return upper === "ADMIN" || upper === "SUPPORT" || upper === "SYSTEM";
}

export function prismaRoleToDemoRole(role: UserRole | string): DemoRole {
  if (isPrismaAdminRole(role)) return "admin";
  if (role.toString().toUpperCase() === "CREATOR") return "creator";
  return "client";
}
