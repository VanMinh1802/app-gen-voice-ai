import { test, expect } from "@playwright/test";

test.describe("GenVoice AI - Pricing Page", () => {
  test("Pricing page loads and displays plans", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("domcontentloaded");
    
    // Check pricing page loads - look for the main heading
    await expect(page.locator("h1").filter({ hasText: /Chọn gói/ })).toBeVisible({ timeout: 15000 });
    
    // Check that plans are displayed
    await expect(page.getByText("Miễn phí")).toBeVisible();
    await expect(page.getByText("Pro")).toBeVisible();
    await expect(page.getByText("0đ", { exact: true })).toBeVisible();
    await expect(page.getByText("100.000đ", { exact: true })).toBeVisible();
  });
});
