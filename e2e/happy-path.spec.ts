/**
 * Happy path E2E — maps to docs/product/phase0-happy-path-qa-script.md
 * Run: npm run e2e  (requires db:seed + dev server or PLAYWRIGHT_SKIP_SERVER with running app)
 */
import { test, expect } from "@playwright/test";
import { loginViaUi, expectHealthyApi } from "./fixtures/auth";

test.describe("Phase 0 Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    await expectHealthyApi(page);
  });

  test("Step 1 — Brand login and wizard entry", async ({ page }) => {
    await loginViaUi(page, "brand");
    await page.goto("/brand/projects/new?lang=en");
    await expect(page.locator("body")).toContainText(/brief|Brief|wizard|Wizard|项目/i);
  });

  test("Step 5–6 — Brand dashboard and studio matching surface", async ({ page }) => {
    await loginViaUi(page, "brand");
    await page.goto("/brand?lang=en");
    await expect(page.locator("body")).toContainText(/project|campaign|项目|广告/i);
  });

  test("Step 11–12 — Studio dashboard and delivery", async ({ page }) => {
    await loginViaUi(page, "creator");
    await page.goto("/studio?lang=en");
    await expect(page.locator("body")).toContainText(/studio|membership|commission|订单|Studio/i);
  });

  test("Step 13 — Brand review hub", async ({ page }) => {
    await loginViaUi(page, "brand");
    await page.goto("/brand/review?lang=en");
    await expect(page.locator("body")).toContainText(/review|审片|Review/i);
  });

  test("Step 14 — Brand settlement", async ({ page }) => {
    await loginViaUi(page, "brand");
    await page.goto("/brand/settlement?lang=en");
    await expect(page.locator("body")).toContainText(/escrow|settlement|托管|结算/i);
  });

  test("Admin — overview and membership config", async ({ page }) => {
    await loginViaUi(page, "admin");
    await page.goto("/admin?lang=en");
    await expect(page.locator("body")).toContainText(/admin|overview|平台|Admin/i);
    await page.goto("/admin/membership?lang=en");
    await expect(page.locator("body")).toContainText(/commission|membership|佣金|会员/i);
  });

  test("OpenAPI spec is served", async ({ page }) => {
    const res = await page.request.get("/api/v1/openapi");
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain("openapi:");
    expect(text).toContain("/api/v1/campaigns");
  });
});
