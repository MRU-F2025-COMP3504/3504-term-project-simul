import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");

    // Check that the page loaded with correct title
    await expect(page).toHaveTitle("Create Next App");
  });
});
