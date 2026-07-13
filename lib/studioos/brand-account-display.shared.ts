import { DEMO_USERS } from "@/lib/demo-auth";

export function sanitizeBrandDisplayName(name: string): string {
  return name
    .replace(/\s*[\(（]\s*(brand|client|品牌方|广告主)\s*[\)）]\s*$/i, "")
    .trim();
}

export function fallbackBrandDisplayName(email: string): string {
  const demo = DEMO_USERS.find((user) => user.email === email.toLowerCase());
  if (demo) {
    return sanitizeBrandDisplayName(demo.label) || demo.label;
  }
  return email.split("@")[0] ?? "Brand";
}

/** Fast, sync display name for Lucien — uses session user fields only (no extra DB). */
export function resolveCopilotDisplayNameFromUser(
  user: {
    email: string;
    fullName?: string | null;
    companyName?: string | null;
    displayName?: string | null;
  },
  role: string
): string {
  if (role === "CREATOR") {
    return (
      user.displayName?.trim() ||
      user.fullName?.trim() ||
      fallbackBrandDisplayName(user.email)
    );
  }

  return (
    sanitizeBrandDisplayName(user.companyName ?? "") ||
    sanitizeBrandDisplayName(user.fullName ?? "") ||
    fallbackBrandDisplayName(user.email)
  );
}
