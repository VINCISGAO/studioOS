import { test, expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "TempVINCIS2026!";

export const DEMO_ACCOUNTS = {
  brand: { email: "client.arc@studioos.test", role: "brand" as const },
  creator: { email: "creator.nova@studioos.test", role: "creator" as const },
  admin: { email: "admin@studioos.test", role: "admin" as const }
};

export async function loginViaUi(
  page: Page,
  account: keyof typeof DEMO_ACCOUNTS,
  lang: "en" | "zh" = "en"
) {
  const { email, role } = DEMO_ACCOUNTS[account];
  await page.goto(`/login?lang=${lang}&role=${role}`);
  await page.locator('input[type="email"], input[name="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in|登录/i }).click();
  await page.waitForURL(/\/(brand|studio|admin|dashboard)/, { timeout: 30_000 });
}

export async function expectHealthyApi(page: Page) {
  const res = await page.request.get("/api/v1/health");
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.success).toBe(true);
}
