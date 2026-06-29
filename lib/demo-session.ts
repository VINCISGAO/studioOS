export type DemoRole = "client" | "creator" | "admin";

export type DemoSession = {
  email: string;
  role: DemoRole;
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
    return parsed;
  } catch {
    return null;
  }
}
