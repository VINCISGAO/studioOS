import type { DemoRole } from "@/lib/demo-session";

export type { DemoRole, DemoSession } from "@/lib/demo-session";
export { parseDemoSession } from "@/lib/demo-session";

export type DemoUser = {
  email: string;
  password: string;
  role: DemoRole;
  label: string;
};

export const DEMO_PASSWORD = "TempStudioOS2026!";

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
  },
  {
    email: "admin@studioos.test",
    password: DEMO_PASSWORD,
    role: "admin",
    label: "Platform admin"
  }
];

export function findDemoUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return DEMO_USERS.find(
    (user) => user.email === normalized && user.password === password
  );
}

export function demoRedirectForRole(role: DemoRole) {
  if (role === "admin") {
    return "/admin";
  }
  if (role === "creator") {
    return "/studio/profile";
  }
  return "/brand";
}

/** Google / Apple / Discord map to the first three demo accounts for each role tab. */
export function demoUserForSocialProvider(
  provider: "google" | "apple" | "discord",
  tabRole: "brand" | "creator"
) {
  const demoRole = tabRole === "creator" ? "creator" : "client";
  const accounts = DEMO_USERS.filter((user) => user.role === demoRole);
  const index = provider === "google" ? 0 : provider === "apple" ? 1 : 2;
  return accounts[index] ?? accounts[0] ?? null;
}
