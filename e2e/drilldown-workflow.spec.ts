import { expect, test } from "@playwright/test";

test.describe("Analytics Drilldown Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to analytics dashboard
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");
  });

  test("complete drilldown workflow from pueblo to category to URL", async ({
    page,
  }) => {
    // 1. Click on a pueblo (e.g., Almonte) to expand level 1
    await page.click('[data-testid="sector-card-almonte"]');

    // Wait for the sector to expand and show the donut chart
    await expect(
      page.locator('[data-testid="expanded-card-almonte"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="donut-chart"]')).toBeVisible();

    // 2. Click on a category slice in the donut (e.g., "naturaleza")
    await page.click('[data-testid="donut-slice-naturaleza"]');

    // Wait for level 2 drilldown panel to appear
    await expect(page.locator('[data-testid="drilldown-panel"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="level2-chart-pair"]')
    ).toBeVisible();

    // Verify the panel shows the correct title
    await expect(page.locator('[data-testid="drilldown-title"]')).toContainText(
      "Almonte • Naturaleza"
    );

    // 3. Click on a URL donut slice to open level 3
    await page.click('[data-testid="level2-donut-slice"]');

    // Wait for level 3 URL details to appear
    await expect(
      page.locator('[data-testid="url-details-modal"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="url-chart"]')).toBeVisible();

    // 4. Close level 3 and verify we go back to level 2
    await page.click('[data-testid="close-url-details"]');
    await expect(
      page.locator('[data-testid="url-details-modal"]')
    ).not.toBeVisible();
    await expect(page.locator('[data-testid="drilldown-panel"]')).toBeVisible();

    // 5. Close level 2 and verify we go back to level 1
    await page.click('[data-testid="close-drilldown"]');
    await expect(
      page.locator('[data-testid="drilldown-panel"]')
    ).not.toBeVisible();
    await expect(
      page.locator('[data-testid="expanded-card-almonte"]')
    ).toBeVisible();
  });

  test("complete drilldown workflow from category to pueblo to URL", async ({
    page,
  }) => {
    // Switch to category view
    await page.click('[data-testid="view-toggle-category"]');
    await page.waitForLoadState("networkidle");

    // 1. Click on a category (e.g., Naturaleza) to expand level 1
    await page.click('[data-testid="sector-card-naturaleza"]');

    // Wait for the sector to expand and show the donut chart
    await expect(
      page.locator('[data-testid="expanded-card-naturaleza"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="donut-chart"]')).toBeVisible();

    // 2. Click on a pueblo slice in the donut (e.g., "almonte")
    await page.click('[data-testid="donut-slice-almonte"]');

    // Wait for level 2 drilldown panel to appear
    await expect(page.locator('[data-testid="drilldown-panel"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="level2-chart-pair"]')
    ).toBeVisible();

    // Verify the panel shows the correct title (reverse order)
    await expect(page.locator('[data-testid="drilldown-title"]')).toContainText(
      "Naturaleza • Almonte"
    );

    // 3. Click on a URL donut slice to open level 3
    await page.click('[data-testid="level2-donut-slice"]');

    // Wait for level 3 URL details to appear
    await expect(
      page.locator('[data-testid="url-details-modal"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="url-chart"]')).toBeVisible();
  });

  test("navigation preserves granularity settings", async ({ page }) => {
    // Change granularity to weekly
    await page.selectOption('[data-testid="granularity-selector"]', "w");

    // Expand a sector and drill down
    await page.click('[data-testid="sector-card-almonte"]');
    await page.click('[data-testid="donut-slice-naturaleza"]');

    // Verify level 2 uses the same granularity
    await expect(page.locator('[data-testid="level2-granularity"]')).toHaveText(
      "Semanal"
    );

    // Navigate to level 3 and verify granularity is preserved
    await page.click('[data-testid="level2-donut-slice"]');
    await expect(page.locator('[data-testid="url-granularity"]')).toHaveText(
      "Semanal"
    );
  });

  test("loading states are displayed during navigation", async ({ page }) => {
    // Mock slow network responses to test loading states
    await page.route("/api/analytics/**", (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    // Click to expand sector
    await page.click('[data-testid="sector-card-almonte"]');

    // Should show loading state
    await expect(page.locator('[data-testid="sector-loading"]')).toBeVisible();

    // Wait for content to load
    await expect(page.locator('[data-testid="donut-chart"]')).toBeVisible();

    // Click to drill down
    await page.click('[data-testid="donut-slice-naturaleza"]');

    // Should show level 2 loading state
    await expect(
      page.locator('[data-testid="drilldown-loading"]')
    ).toBeVisible();

    // Wait for level 2 to load
    await expect(
      page.locator('[data-testid="level2-chart-pair"]')
    ).toBeVisible();
  });

  test("error handling for failed API requests", async ({ page }) => {
    // Mock API failure
    await page.route("/api/analytics/pueblo/**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    // Try to expand a sector
    await page.click('[data-testid="sector-card-almonte"]');

    // Should show error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "Error loading data"
    );
  });

  test("responsive behavior on different screen sizes", async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Expand sector and drill down
    await page.click('[data-testid="sector-card-almonte"]');
    await page.click('[data-testid="donut-slice-naturaleza"]');

    // Verify level 2 panel is displayed properly on mobile
    await expect(page.locator('[data-testid="drilldown-panel"]')).toBeVisible();

    // Check that charts are responsive
    const chartPair = page.locator('[data-testid="level2-chart-pair"]');
    const boundingBox = await chartPair.boundingBox();
    expect(boundingBox?.width).toBeLessThan(400);

    // Test on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Verify layout adjusts appropriately
    const chartPairDesktop = page.locator('[data-testid="level2-chart-pair"]');
    const desktopBox = await chartPairDesktop.boundingBox();
    expect(desktopBox?.width).toBeGreaterThan(400);
  });

  test("data consistency between levels", async ({ page }) => {
    // Expand almonte sector
    await page.click('[data-testid="sector-card-almonte"]');

    // Get the naturaleza slice value from level 1
    const level1Value = await page.textContent(
      '[data-testid="donut-slice-naturaleza"] [data-testid="slice-value"]'
    );

    // Click to drill down
    await page.click('[data-testid="donut-slice-naturaleza"]');

    // Verify the title in level 2 shows the same value/percentage
    const level2Title = await page.textContent(
      '[data-testid="drilldown-title"]'
    );
    expect(level2Title).toContain("Naturaleza");

    // Verify data consistency (the sum of URLs should match the parent category)
    const urlValues = await page.$$eval(
      '[data-testid="level2-donut-slice"] [data-testid="slice-value"]',
      (elements) => elements.map((el) => parseFloat(el.textContent || "0"))
    );
    const urlSum = urlValues.reduce((sum, val) => sum + val, 0);
    const parentValue = parseFloat(level1Value || "0");

    // Allow for small rounding differences
    expect(Math.abs(urlSum - parentValue)).toBeLessThan(1);
  });
});
