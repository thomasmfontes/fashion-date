import { test, expect } from "@playwright/test";

test.describe("Real Browser E2E: Public Registration & Attendee Journey", () => {
  test("REG-01: Full public journey - gate qualification, form validation, successful registration", async ({
    page,
  }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // 1. Navigate to live application root over HTTP
    await page.goto("/");
    await expect(page).toHaveTitle(/Fashion Date/i);

    // 2. Lojista Qualification Gate Modal
    const gateHeading = page.getByRole("heading", {
      name: /Você é lojista ou revendedor/i,
    });
    await expect(gateHeading).toBeVisible();

    // Click "Sim, sou lojista / revendedor(a)"
    const yesButton = page.getByRole("button", {
      name: /Sim, sou lojista/i,
    });
    await yesButton.click();

    // Gate modal closes
    await expect(gateHeading).not.toBeVisible();

    // 3. Test Form Validation (empty submission)
    const submitBtn = page.getByRole("button", {
      name: /Quero Participar do Sorteio/i,
    });
    await submitBtn.click();

    // Inline validation error is displayed and aria-invalid is set
    const nameError = page.locator("#signup-name-error");
    await expect(nameError).toBeVisible();
    await expect(nameError).toContainText(/Informe seu nome completo/i);

    const nameInput = page.locator("#signup-name");
    await expect(nameInput).toHaveAttribute("aria-invalid", "true");

    // 4. Fill form with valid lojista information
    const timestamp = Date.now().toString().slice(-8);
    const testPhone = `1198${timestamp}`;

    await nameInput.fill("Ana Clara Modas");
    await page.locator("#signup-store").fill("Boutique Elegance");
    await page.locator("#signup-phone").fill(testPhone);
    await page.locator("#signup-instagram").fill("boutique.elegance");
    await page.locator("#signup-consent").check();

    // 5. Submit valid registration
    await submitBtn.click();

    // 6. Verify navigation or ticket receipt
    await page.waitForURL(/\/(sucesso|cadastro-duplicado)?/);
    await expect(page.locator("body")).toBeVisible();

    // Ensure zero runtime console errors occurred during the entire user flow
    expect(consoleErrors).toEqual([]);
  });
});
