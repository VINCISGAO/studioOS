export type DemoRole = "client" | "creator" | "admin";

export type DemoSession = {
  email: string;
  role: DemoRole;
  /** Prisma User.id when DATABASE_URL is configured */
  userId?: string;
};

export function parseDemoSession(raw: string | undefined): DemoSession | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DemoSession;
    if (!parsed.email || !["client", "creator", "admin"].includes(parsed.role)) {
      return null;
    }
    return {
      email: parsed.email,
      role: parsed.role as DemoRole,
      userId: typeof parsed.userId === "string" ? parsed.userId : undefined
    };
  } catch {
    return null;
  }
}
