import { expect, test } from "@playwright/test";

test.describe("Design System Visual Regression", () => {
  test("full design system page renders all components", async ({ page }) => {
    await page.goto("/design-system");
    await page.waitForLoadState("networkidle");

    // Wait for the page to fully render
    await page.waitForSelector("h1:has-text('Design System')");

    // Give any animations time to settle
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("design-system-full.png", {
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("design system page - dark mode", async ({ page }) => {
    await page.goto("/design-system");
    await page.waitForLoadState("networkidle");

    // Wait for the page to fully render
    await page.waitForSelector("h1:has-text('Design System')");

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });

    // Give dark mode styles time to apply
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("design-system-full-dark.png", {
      animations: "disabled",
      caret: "hide",
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("typography section renders correctly", async ({ page }) => {
    await page.goto("/design-system");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("h1:has-text('Design System')");

    // Scroll to typography section and screenshot it
    await page.locator("h2:has-text('Typography')").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const typographySection = page.locator("h2:has-text('Typography')").locator("..");
    await expect(typographySection).toHaveScreenshot("design-system-typography.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("buttons section renders all variants and sizes", async ({ page }) => {
    await page.goto("/design-system");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("h1:has-text('Design System')");

    // Scroll to buttons section
    await page.locator("h2:has-text('Buttons')").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const buttonsSection = page.locator("h2:has-text('Buttons')").locator("..");
    await expect(buttonsSection).toHaveScreenshot("design-system-buttons.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("badges section renders all variants", async ({ page }) => {
    await page.goto("/design-system");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("h1:has-text('Design System')");

    await page.locator("h2:has-text('Badges')").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const badgesSection = page.locator("h2:has-text('Badges')").locator("..");
    await expect(badgesSection).toHaveScreenshot("design-system-badges.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("inputs section renders with all states", async ({ page }) => {
    await page.goto("/design-system");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("h1:has-text('Design System')");

    await page.locator("h2:has-text('Inputs')").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const inputsSection = page.locator("h2:has-text('Inputs')").locator("..");
    await expect(inputsSection).toHaveScreenshot("design-system-inputs.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("data table renders with pagination", async ({ page }) => {
    await page.goto("/design-system");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("h1:has-text('Design System')");

    await page.locator("h2:has-text('Data Table')").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const dataTableSection = page.locator("h2:has-text('Data Table')").locator("..");
    await expect(dataTableSection).toHaveScreenshot("design-system-data-table.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    });
  });

  test("metric tiles and context rows present data correctly", async ({ page }) => {
    await page.goto("/design-system");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("h1:has-text('Design System')");

    await page.locator("h2:has-text('Metric Tile')").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const metricsSection = page.locator("h2:has-text('Metric Tile')").locator("..");
    await expect(metricsSection).toHaveScreenshot("design-system-metrics.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    });
  });
});
