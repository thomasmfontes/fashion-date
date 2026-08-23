import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "compact-mobile (320x568)", width: 320, height: 568 },
  { name: "standard-mobile (375x812)", width: 375, height: 812 },
  { name: "tablet-portrait (768x1024)", width: 768, height: 1024 },
  { name: "tablet-landscape (1024x768)", width: 1024, height: 768 },
  { name: "desktop (1440x900)", width: 1440, height: 900 },
  { name: "full-hd-telao (1920x1080)", width: 1920, height: 1080 },
];

test.describe("Real Browser E2E: Multi-Viewport Responsive Layout Verification", () => {
  for (const vp of VIEWPORTS) {
    test(`RESPONSIVE: renders cleanly without horizontal overflow at ${vp.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      // 1. Check Landing Page
      await page.goto("/");
      await expect(page.locator("body")).toBeVisible();

      // Check no unintended horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // 2. Check Admin Page
      await page.goto("/admin");
      await expect(page.locator("body")).toBeVisible();

      // 3. Check Live Stage Telão
      await page.goto("/admin/sorteio");
      await expect(page.locator("body")).toBeVisible();

      // Ensure zero uncaught errors
      expect(consoleErrors).toEqual([]);
    });
  }
});
