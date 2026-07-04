import { isPrismaAdminRole } from "@/lib/auth/route-access";
import type { UserRole } from "@prisma/client";

/** Platform admin accounts must never sign in through brand/creator user flows. */
export function isPlatformAdminUserRole(role: UserRole | string) {
  return isPrismaAdminRole(role);
}
