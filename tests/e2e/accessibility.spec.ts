import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Accessibility (aXe)", () => {
  test("sign-in page has no critical aXe violations", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const violations = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(violations.length).toBe(0);
  });

  test("platform dashboard has no critical aXe violations", async ({ page }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const violations = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(violations.length).toBe(0);
  });
});
