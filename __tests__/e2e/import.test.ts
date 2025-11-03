import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test("should render the Dashboard and SignoutButton", async ({ page }) => {
    await page.goto("/dashboard");

    // Check that something from SignoutButton appears
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });
});