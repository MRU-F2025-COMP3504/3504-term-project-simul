import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the home page with correct title", async ({ page }) => {
    await expect(page).toHaveTitle("Simul");
  });

  test("should display the hero description", async ({ page }) => {
    await expect(page.getByText(/Watch instructor coding playbacks/i)).toBeVisible();
    await expect(page.getByText(/Perfect for instructors creating interactive lessons/i)).toBeVisible();
  });

  test("should display Sign In button in header when not authenticated", async ({ page }) => {
    const header = page.locator("header");
    const headerSignInButton = header.getByRole("button", { name: /sign in/i });
    await expect(headerSignInButton).toBeVisible();
  });

  test("should display Sign In button in hero section when not authenticated", async ({ page }) => {
    const main = page.locator("main");
    const heroSignInButton = main.getByRole("button", { name: /sign in/i });
    await expect(heroSignInButton).toBeVisible();
  });

  test("should display Learn More button when not authenticated", async ({ page }) => {
    const learnMoreButton = page.getByRole("link", { name: /learn more/i });
    await expect(learnMoreButton).toBeVisible();
  });

  test("should navigate to features section when Learn More is clicked", async ({ page }) => {
    const learnMoreButton = page.getByRole("link", { name: /learn more/i });
    await learnMoreButton.click();

    await expect(page).toHaveURL(/#features$/);

    await expect(page.getByRole("heading", { name: /how it works/i })).toBeVisible();
  });

  test("should display banner component with logo", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();
  });

  test("should display theme toggle in header", async ({ page }) => {
    const header = page.locator("header");
    const themeToggle = header.getByRole("button", { name: /toggle theme/i });
    await expect(themeToggle).toBeVisible();
  });

  test("should display footer component", async ({ page }) => {
    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();
  });
});
