import { test, expect } from "@playwright/test";

test.describe("Real Browser E2E: Admin Portal & Live Stage Telão", () => {
  test("ADMIN-01: Admin portal access, live telão display, and clean console execution", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // 1. Navigate to Admin Login
    await page.goto("/admin");
    await expect(page).toHaveTitle(/Fashion Date/i);

    // Verify Admin Portal UI elements
    const passwordInput = page.locator("#admin-password");
    await expect(passwordInput).toBeVisible();

    const loginButton = page.getByRole("button", { name: /Acessar Painel/i });
    await expect(loginButton).toBeVisible();

    // 2. Navigate to Live Telão Stage
    await page.goto("/admin/sorteio");
    await expect(page.locator("body")).toBeVisible();

    // Verify luxury stage UI elements
    const drawHeading = page.locator("h1");
    await expect(drawHeading).toBeVisible();

    // Ensure zero uncaught console errors on live telão render
    expect(consoleErrors).toEqual([]);
  });
});
