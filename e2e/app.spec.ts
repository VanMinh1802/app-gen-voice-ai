import { test, expect } from "@playwright/test";

test.describe("GenVoice AI - Pricing Page", () => {
  test("when subscription UI is disabled, /pricing redirects home", async ({
    page,
  }) => {
    await page.goto("/pricing");
    await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
  });
});
