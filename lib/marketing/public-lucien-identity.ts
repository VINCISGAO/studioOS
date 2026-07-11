import { publicLucienCopy, type PublicLucienCopy } from "@/lib/marketing/faq-copy";
import type { Locale } from "@/lib/i18n";

export type PublicLucienViewerIdentity = "guest" | "brand" | "creator" | "admin" | "support";

export function resolvePublicLucienViewerIdentity(role?: string | null): PublicLucienViewerIdentity {
  const normalized = role?.trim().toUpperCase();
  if (normalized === "BRAND") return "brand";
  if (normalized === "CREATOR") return "creator";
  if (normalized === "ADMIN") return "admin";
  if (normalized === "SUPPORT") return "support";
  return "guest";
}

export function publicLucienIdentityLabel(
  locale: Locale,
  identity: PublicLucienViewerIdentity
): string {
  return publicLucienCopy(locale).identity[identity];
}

export type PublicLucienAuthUser = {
  role: string;
  displayName?: string | null;
  fullName?: string | null;
  companyName?: string | null;
};

export function publicLucienWelcomeMessage(
  locale: Locale,
  identity: PublicLucienViewerIdentity,
  user?: PublicLucienAuthUser | null
): string {
  const copy = publicLucienCopy(locale);
  if (identity === "guest") return copy.welcome;

  const name =
    user?.displayName?.trim() ||
    user?.companyName?.trim() ||
    user?.fullName?.trim() ||
    null;

  if (locale === "zh") {
    const greeting = name ? `${name}，` : "";
    if (identity === "brand") {
      return `${greeting}你好，我是卢西恩。我可以解答平台常见问题，也可以在你登录后协助项目与付款相关事项。`;
    }
    if (identity === "creator") {
      return `${greeting}你好，我是卢西恩。我可以解答平台常见问题，也可以在你登录后协助接单与交付相关事项。`;
    }
    return `${greeting}你好，我是卢西恩。我可以解答平台常见问题。`;
  }

  const greeting = name ? `${name}, ` : "";
  if (identity === "brand") {
    return `${greeting}hi — I'm Lucien. I can answer common platform questions and help with projects and payments once you're signed in.`;
  }
  if (identity === "creator") {
    return `${greeting}hi — I'm Lucien. I can answer common platform questions and help with invitations and delivery once you're signed in.`;
  }
  return `${greeting}hi — I'm Lucien. I can answer common platform questions.`;
}

export type PublicLucienIdentityCopy = PublicLucienCopy["identity"];
