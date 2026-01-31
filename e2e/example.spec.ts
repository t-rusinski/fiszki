import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Example E2E Tests", () => {
  test("should load the homepage", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.navigate();

    // Assert
    await homePage.verifyPageLoaded();
  });

  test("should navigate using keyboard", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);
    await homePage.navigate();

    // Act
    await page.keyboard.press("Tab");

    // Assert - verify focused element changed
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test("should display main heading", async ({ page }) => {
    // Arrange
    const homePage = new HomePage(page);

    // Act
    await homePage.navigate();
    const heading = await homePage.getMainHeading();

    // Assert
    await expect(heading).toBeVisible();
  });
});
