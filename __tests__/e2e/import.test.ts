import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test("should render the Home page and show the Sign In button", async ({ page }) => {
    // Navigate to the home page
    await page.goto("/");

    // Wait for the Sign In button to appear
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await expect(signInButton).toBeVisible({ timeout: 15000 });
  });
});
