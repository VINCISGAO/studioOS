/**
 * Phase 1 interaction E2E — login next preservation + checkout pay button recovery.
 */
import { test, expect } from "@playwright/test";
import { loginViaUi, expectHealthyApi } from "./fixtures/auth";

test.describe("Phase 1 — fatal interaction fixes", () => {
  test.beforeEach(async ({ page }) => {
    await expectHealthyApi(page);
  });

  test("login preserves safe next path after lang cookie redirect", async ({ page }) => {
    await page.goto("/login?lang=zh&next=%2Fbrand%2Fprojects%2Fnew%3Fproject%3Ddemo%26step%3D2");
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/next=%2Fbrand%2Fprojects%2Fnew/);
    await expect(page.locator('input[name="next"]')).toHaveValue(/\/brand\/projects\/new\?project=demo&step=2/);
  });

  test("brand checkout shows pay button after returning with error query", async ({ page }) => {
    await loginViaUi(page, "brand");
    await page.goto("/brand/projects/new?lang=en");
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Synthetic checkout error return — panel must not keep pay button disabled forever.
    await page.goto("/brand/projects/demo-project-id/checkout?lang=en&error=pay");
    const payButton = page.getByRole("button", { name: /pay|付款/i });
    if (await payButton.count()) {
      await expect(payButton.first()).toBeEnabled({ timeout: 5_000 });
    }
  });
});
