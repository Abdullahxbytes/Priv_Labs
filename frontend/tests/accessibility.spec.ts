import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const app = {
  appId: "org.example.test",
  name: "A very long app name for testing responsive result layouts",
  developer: "Example developer",
  icon: null,
  rating: 4.2,
  category: "Tools",
  storeUrl: null,
};
for (const width of [320, 768, 1440]) {
  test(`search and report accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/search?*", (route) => route.fulfill({ json: { results: [app] } }));
    await page.route("**/api/analyze/*", (route) =>
      route.fulfill({
        json: {
          app,
          score: 100,
          riskLevel: "LOW",
          sourceStatus: {
            permissions: "unavailable",
            dataSafety: "available",
            privacyPolicy: "available",
            aiAnalysis: "available",
          },
          permissions: [
            {
              raw: null,
              name: "Read contacts",
              category: "identity",
              risk: "HIGH",
              expected: null,
              explanation: "Can read account or contact identity information.",
            },
          ],
          dataCollected: [],
          dataShared: [
            {
              type: "approximate_location",
              label: "Approximate location",
              purposes: ["Advertising"],
              source: ["dataSafety"],
              status: "found",
              recipients: ["Advertisers"],
            },
          ],
          summary: [],
          positiveFindings: [],
          mismatches: [
            {
              id: "notice",
              type: "INSUFFICIENT_INFORMATION",
              severity: null,
              title: "Incomplete coverage",
              explanation: "Permissions unavailable.",
              sources: ["permissions"],
              evidenceIds: ["snippet"],
            },
          ],
          evidence: [
            {
              id: "snippet",
              source: "privacyPolicy",
              category: "location",
              status: "found",
              excerpt: "LongUnbrokenText".repeat(40),
              sourceUrl: "https://example.com/privacy",
            },
          ],
        },
      }),
    );
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
    await page.getByRole("searchbox").fill("test");
    await page.getByRole("searchbox").press("Enter");
    await page.getByRole("button", { name: /Select app/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: /Analyze privacy/ })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/search-${width}.png`, fullPage: true });
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(app.name);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await expect(
      page.getByRole("list", { name: "Can access details" }).getByText("Identity", { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("list", { name: "Says it shares details" })
        .getByText("Approximate location", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".report-source-pills")).toHaveCount(0);
    await page.getByRole("button", { name: "See the details" }).click();
    await expect(page.locator("#full-report")).toHaveAttribute("open", "");
    await page.getByText("What did not match?", { exact: true }).click();
    await page.getByRole("link", { name: "See the proof" }).click();
    await expect(page.locator("#evidence-snippet")).toHaveAttribute("open", "");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `test-results/report-${width}.png`, fullPage: true });
  });
}

test("empty query, server error, and no results are announced", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("searchbox")).toBeFocused();
  await expect(page.getByRole("searchbox")).toHaveAttribute("aria-invalid", "true");
  await page.route("**/api/search?*", (route) => route.fulfill({ status: 502, json: {} }));
  await page.getByRole("searchbox").fill("test");
  await page.getByRole("searchbox").press("Enter");
  await expect(page.locator("#search-error")).toBeVisible();
  await page.unroute("**/api/search?*");
  await page.route("**/api/search?*", (route) => route.fulfill({ json: { results: [] } }));
  await page.getByRole("button", { name: "Retry search" }).click();
  await expect(page.getByRole("status")).toContainText("No apps found");
});

test("contributor avatars reveal linked profiles on hover and focus", async ({ page }) => {
  await page.goto("/");
  const profileButton = page.getByRole("button", {
    name: "Show Abdullah Mehmood's GitHub profile",
  });
  const profileLink = page.getByRole("link", { name: /@Abdullahxbytes/ });

  await profileButton.hover();
  await expect(profileLink).toBeVisible();
  await expect(profileLink).toHaveAttribute("href", "https://github.com/Abdullahxbytes");

  await profileButton.focus();
  await expect(profileLink).toBeVisible();
});
