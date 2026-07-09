import type { DemoRole } from "@/lib/demo-session";

export type { DemoRole, DemoSession } from "@/lib/demo-session";
export { parseDemoSession } from "@/lib/demo-session";

export type DemoUser = {
  email: string;
  password: string;
  role: DemoRole;
  label: string;
};

export const DEMO_PASSWORD = "TempVINCIS2026!";

export const DEMO_USERS: DemoUser[] = [
  {
    email: "client.arc@studioos.test",
    password: DEMO_PASSWORD,
    role: "client",
    label: "Arc & Alloy (brand)"
  },
  {
    email: "client.bright@studioos.test",
    password: DEMO_PASSWORD,
    role: "client",
    label: "BrightSip (brand)"
  },
  {
    email: "client.north@studioos.test",
    password: DEMO_PASSWORD,
    role: "client",
    label: "Northline Skincare (brand)"
  },
  {
    email: "creator.nova@studioos.test",
    password: DEMO_PASSWORD,
    role: "creator",
    label: "Nova Motion Studio"
  },
  {
    email: "creator.signal@studioos.test",
    password: DEMO_PASSWORD,
    role: "creator",
    label: "Signal Frame Lab"
  },
  {
    email: "creator.atlas@studioos.test",
    password: DEMO_PASSWORD,
    role: "creator",
    label: "Atlas UGC Systems"
  }
];

export function findDemoUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  return DEMO_USERS.find(
    (user) => user.email === normalized && user.password === normalizedPassword
  );
}

export function demoRedirectForRole(role: DemoRole) {
  if (role === "creator") {
    return "/studio";
  }
  return "/brand";
}

export type DemoSocialProvider = "google" | "apple" | "alipay" | "wechat" | "qq";

/** Providers without real OAuth — each maps to a distinct @studioos.test account. */
export const TEST_SOCIAL_PROVIDERS = ["apple", "wechat", "qq"] as const satisfies readonly DemoSocialProvider[];

export type TestSocialProvider = (typeof TEST_SOCIAL_PROVIDERS)[number];

export function isTestSocialProvider(provider: string): provider is TestSocialProvider {
  return (TEST_SOCIAL_PROVIDERS as readonly string[]).includes(provider);
}

/** Internal QA accounts — never receive real email; login uses on-screen verification code. */
export function isStudioTestEmail(email: string) {
  return email.trim().toLowerCase().endsWith("@studioos.test");
}

/** Social providers map deterministically to demo accounts for each role tab. */
export function demoUserForSocialProvider(provider: DemoSocialProvider, tabRole: "brand" | "creator") {
  const demoRole = tabRole === "creator" ? "creator" : "client";
  const accounts = DEMO_USERS.filter((user) => user.role === demoRole);

  const testProviderIndex: Record<TestSocialProvider, number> = {
    apple: 0,
    wechat: 1,
    qq: 2
  };

  if (isTestSocialProvider(provider)) {
    return accounts[testProviderIndex[provider]] ?? accounts[0] ?? null;
  }

  const index = provider === "google" ? 0 : provider === "alipay" ? 2 : 1;
  return accounts[index] ?? accounts[0] ?? null;
}
