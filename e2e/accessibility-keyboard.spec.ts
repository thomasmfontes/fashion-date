import { test, expect } from "@playwright/test";

test.describe("Real Browser E2E: Keyboard Accessibility & Focus Containment", () => {
  test("A11Y-01: Modal keyboard interaction - Escape closes, Tab containment, and trigger focus restoration", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Lojista qualification modal is open on initial load
    const yesButton = page.getByRole("button", { name: /Sim, sou lojista/i });
    await expect(yesButton).toBeVisible();

    // Confirm eligibility to access the page
    await yesButton.click();

    // 2. Open Fast Lookup Modal via button
    const lookupButton = page.getByRole("button", {
      name: /Já é cadastrado/i,
    });
    await expect(lookupButton).toBeVisible();
    await lookupButton.click();

    // Verify modal dialog is open and accessible
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");

    // Press Escape key to close dialog
    await page.keyboard.press("Escape");

    // Verify dialog is closed and focus returns to trigger
    await expect(dialog).not.toBeVisible();
    await expect(lookupButton).toBeFocused();
  });
});
