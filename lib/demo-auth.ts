import type { DemoRole } from "@/lib/demo-session";

export type { DemoRole, DemoSession } from "@/lib/demo-session";
export { parseDemoSession } from "@/lib/demo-session";

export type DemoUser = {
  email: string;
  password: string;
  role: DemoRole;
  label: string;
};

/** @deprecated Test accounts removed — real accounts only. */
export const DEMO_PASSWORD = "";

/** Test accounts retired — production uses real email / OAuth only. */
export const DEMO_USERS: DemoUser[] = [];

export function findDemoUser(_email: string, _password: string) {
  return undefined;
}

export function demoRedirectForRole(role: DemoRole) {
  if (role === "creator") {
    return "/studio";
  }
  return "/brand";
}

export type DemoSocialProvider = "google" | "apple" | "alipay" | "wechat" | "qq";

/** Retired — Apple / WeChat / QQ stay disabled on the login page. */
export const TEST_SOCIAL_PROVIDERS = [] as const;

export type TestSocialProvider = never;

export function isTestSocialProvider(_provider: string): _provider is TestSocialProvider {
  return false;
}

export function isStudioTestEmail(email: string) {
  return email.trim().toLowerCase().endsWith("@studioos.test");
}

export function demoUserForSocialProvider(
  _provider: DemoSocialProvider,
  _tabRole: "brand" | "creator"
): DemoUser | null {
  return null;
}
