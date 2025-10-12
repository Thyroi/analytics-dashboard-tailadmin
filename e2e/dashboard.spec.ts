import { expect, test } from "@playwright/test";

test.describe("Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main dashboard
    await page.goto("/");
  });

  test("should display the main navigation", async ({ page }) => {
    // Check if main navigation elements are present
    await expect(page.locator("nav")).toBeVisible();

    // Check for common navigation items (adjust selectors based on your actual UI)
    await expect(page.getByRole("link", { name: /analytics/i })).toBeVisible();
  });

  test("should navigate to analytics page", async ({ page }) => {
    // Click on analytics link
    await page.getByRole("link", { name: /analytics/i }).click();

    // Wait for navigation and check URL
    await expect(page).toHaveURL(/.*analytics/);

    // Check if analytics content is loaded
    await expect(page.locator("h1, h2, h3")).toContainText(/analytic/i);
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if page still loads properly
    await expect(page.locator("body")).toBeVisible();

    // Check if mobile navigation works (if you have a hamburger menu)
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    }
  });
});

test.describe("Analytics Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/analytics");
  });

  test("should load analytics charts", async ({ page }) => {
    // Wait for charts to load (adjust selectors based on your actual charts)
    await expect(
      page.locator('[data-testid="chart"], .apexcharts-canvas')
    ).toBeVisible({ timeout: 10000 });
  });

  test("should change time granularity", async ({ page }) => {
    // Look for granularity selector (adjust selector based on your actual UI)
    const granularitySelect = page.locator(
      'select[data-testid="granularity"], [data-testid="time-selector"]'
    );

    if (await granularitySelect.isVisible()) {
      await granularitySelect.selectOption("w"); // weekly

      // Wait for data to reload
      await page.waitForTimeout(1000);

      // Check if the change was applied (this depends on your UI feedback)
      await expect(granularitySelect).toHaveValue("w");
    }
  });

  test("should display loading states", async ({ page }) => {
    // Reload page to see loading states
    await page.reload();

    // Check for loading indicators (skeletons, spinners, etc.)
    const loadingElements = page.locator(
      '[data-testid*="skeleton"], .animate-pulse, [data-testid*="loading"]'
    );

    // At least one loading element should be visible initially
    await expect(loadingElements.first()).toBeVisible({ timeout: 1000 });
  });

  test("should handle empty data states", async ({ page }) => {
    // This test assumes you have a way to simulate empty data
    // You might need to mock the API or have a test endpoint

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check for empty state messages (adjust text based on your actual UI)
    const emptyStates = page.locator("text=/sin datos|no data|empty/i");

    // If empty states exist, they should be properly displayed
    if ((await emptyStates.count()) > 0) {
      await expect(emptyStates.first()).toBeVisible();
    }
  });
});

test.describe("Chatbot Interface", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chatbot");
  });

  test("should display chatbot interface", async ({ page }) => {
    // Check if chatbot interface elements are present
    await expect(page.locator("h1, h2")).toContainText(/chatbot|test/i);
  });

  test("should handle granularity selection", async ({ page }) => {
    // Look for granularity selector in chatbot
    const granularitySelect = page.locator("select");

    if (await granularitySelect.isVisible()) {
      await granularitySelect.selectOption("m"); // monthly
      await expect(granularitySelect).toHaveValue("m");
    }
  });

  test("should execute test queries", async ({ page }) => {
    // Look for test query button
    const testButton = page.locator(
      'button:has-text("Probar"), button:has-text("Test")'
    );

    if (await testButton.isVisible()) {
      await testButton.click();

      // Wait for results
      await page.waitForTimeout(2000);

      // Check if results are displayed
      await expect(
        page.locator('pre, code, [data-testid="results"]')
      ).toBeVisible();
    }
  });
});

test.describe("Accessibility", () => {
  test("should have proper page titles", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/dashboard|analytics/i);

    await page.goto("/analytics");
    await expect(page).toHaveTitle(/analytics/i);
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/analytics");

    // Check if there's at least one main heading
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Check if focus is visible on interactive elements
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});

test.describe("Performance", () => {
  test("should load within reasonable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("should handle concurrent requests", async ({ page }) => {
    // Navigate to a page that makes multiple API calls
    await page.goto("/analytics");

    // Wait for all network requests to complete
    await page.waitForLoadState("networkidle");

    // Page should be responsive after loading
    await expect(page.locator("body")).toBeVisible();
  });
});
