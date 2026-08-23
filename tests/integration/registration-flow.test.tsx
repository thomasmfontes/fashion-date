import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { resetInMemStore } from "@/tests/mocks/cloudflare-workers";

describe("Component Integration: Public Attendee Registration & Verification Flow", () => {
  beforeEach(() => {
    resetInMemStore();
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();

    // Mock window.location.assign
    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        assign: vi.fn(),
        href: "http://localhost/",
        reload: vi.fn(),
      },
    });
  });

  it("INT-REG-01: complete public flow - Qualification Gate -> Form Input -> Submission -> Ticket Saved", async () => {
    const user = userEvent.setup();

    // Mock fetch for registration API and live draw status
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/api/live-draw")) {
        return new Response(
          JSON.stringify({
            drawId: null,
            winnerNumber: null,
            registrationsOpen: true,
          }),
          { headers: { "Content-Type": "application/json", ETag: '"baseline"' } },
        );
      }

      if (url.includes("/api/participants") && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        return new Response(
          JSON.stringify({
            duplicate: false,
            participant: {
              id: 42,
              luckyNumber: "0789",
              name: body.name,
              store: body.store,
              phone: body.phone,
              instagram: body.instagram,
              createdAt: new Date().toISOString(),
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({}), { status: 200 });
    });

    render(<Home />);

    // 1. Initial Qualification Gate Modal is visible
    expect(screen.getByText(/Você é lojista ou revendedor/i)).toBeDefined();

    // Confirm eligibility: "Sim, sou lojista / revendedor(a)"
    const yesBtn = screen.getByRole("button", {
      name: /Sim, sou lojista/i,
    });
    await user.click(yesBtn);

    // Modal is dismissed and gate confirmation saved
    await waitFor(() => {
      expect(
        screen.queryByText(/Você é lojista ou revendedor/i),
      ).toBeNull();
    });

    // 2. Form fields are accessible
    const nameInput = screen.getByLabelText(/Nome completo/i);
    const storeInput = screen.getByLabelText(/Nome da loja/i);
    const phoneInput = screen.getByLabelText(/WhatsApp/i);
    const instagramInput = screen.getByLabelText(/Usuário do Instagram/i);
    const consentCheckbox = screen.getByRole("checkbox");
    const submitBtn = screen.getByRole("button", {
      name: /Quero Participar do Sorteio/i,
    });

    // Fill form
    await user.type(nameInput, "Renata Castanheira");
    await user.type(storeInput, "Boutique Crente Chic");
    await user.type(phoneInput, "11987654321");
    await user.type(instagramInput, "crentechic");
    await user.click(consentCheckbox);

    // 3. Submit
    await user.click(submitBtn);

    // 4. Verify participant saved to storage for persistent attendee ticket access
    await waitFor(() => {
      const saved =
        localStorage.getItem("fashion_date_registered_user") ||
        sessionStorage.getItem("fashion-date-participant");
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.luckyNumber).toBe("0789");
      expect(parsed.name).toBe("Renata Castanheira");
    });
  });

  it("INT-REG-02: validation UX - highlights missing fields and displays inline error messages", async () => {
    const user = userEvent.setup();

    // Mock live draw
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ registrationsOpen: true }), {
        headers: { "Content-Type": "application/json" },
      }),
    );

    // Bypass gate for this test
    sessionStorage.setItem("fd_lojista_confirmed", "true");

    render(<Home />);

    const submitBtn = screen.getByRole("button", {
      name: /Quero Participar do Sorteio/i,
    });

    // Submit empty form
    await user.click(submitBtn);

    // Assert field-level error messages
    await waitFor(() => {
      expect(
        screen.getByText(/Informe seu nome completo/i),
      ).toBeDefined();
    });
    expect(
      screen.getByLabelText(/Nome completo/i).getAttribute("aria-invalid"),
    ).toBe("true");
  });
});
