import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InscricaoPage from "@/app/inscricao/page";
import { resetInMemStore } from "@/tests/mocks/cloudflare-workers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/inscricao",
}));

vi.mock("@/hooks/useAuthGuard", () => ({
  useAuthGuard: () => ({
    status: "authenticated_unregistered",
    user: null,
    participant: null,
    isLoading: false,
    registrationsOpen: true,
  }),
}));

describe("Component Integration: Public Attendee Registration & Verification Flow", () => {
  beforeEach(() => {
    resetInMemStore();
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();

    Object.defineProperty(window, "location", {
      writable: true,
      value: {
        assign: vi.fn(),
        href: "http://localhost/inscricao",
        reload: vi.fn(),
      },
    });
  });

  it("INT-REG-01: complete public flow - Form Input -> Submission -> Ticket Saved", async () => {
    const user = userEvent.setup();

    // Mock fetch for registration API and live draw status
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/api/participants")) {
        if (init?.method === "POST") {
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
                userType: body.userType || "lojista",
                createdAt: new Date().toISOString(),
              },
            }),
            { status: 201, headers: { "Content-Type": "application/json" } },
          );
        } else {
          // GET lookup by phone
          return new Response(
            JSON.stringify({
              ok: true,
              participant: {
                id: 42,
                luckyNumber: "0789",
                name: "Renata Castanheira",
                store: "Boutique Crente Chic",
                phone: "11987654321",
                instagram: "crentechic",
                userType: "lojista",
                createdAt: new Date().toISOString(),
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
      }

      return new Response(JSON.stringify({}), { status: 200 });
    });

    render(<InscricaoPage />);

    // Form fields are accessible
    const nameInput = screen.getByLabelText(/Nome completo/i);
    const storeInput = screen.getByLabelText(/Nome da loja/i);
    const phoneInput = screen.getByLabelText(/WhatsApp/i);
    const instagramInput = screen.getByLabelText(/Instagram/i);
    const consentCheckbox = screen.getByRole("checkbox");
    const submitBtn = screen.getByRole("button", {
      name: /Concluir Cadastro|Quero Participar/i,
    });

    // Fill form
    await user.type(nameInput, "Renata Castanheira");
    await user.type(storeInput, "Boutique Crente Chic");
    await user.type(phoneInput, "11987654321");
    await user.type(instagramInput, "crentechic");
    await user.click(consentCheckbox);

    // Submit
    await user.click(submitBtn);

    // Verify participant saved to storage for persistent attendee ticket access
    await waitFor(
      () => {
        const saved =
          localStorage.getItem("fashion_date_registered_user") ||
          sessionStorage.getItem("fashion-date-participant");
        expect(saved).not.toBeNull();
        const parsed = JSON.parse(saved!);
        expect(parsed.luckyNumber).toBe("0789");
        expect(parsed.name).toBe("Renata Castanheira");
      },
      { timeout: 4000 },
    );
  });

  it("INT-REG-02: validation UX - highlights missing fields and displays inline error messages", async () => {
    const user = userEvent.setup();

    render(<InscricaoPage />);

    const submitBtn = screen.getByRole("button", {
      name: /Concluir Cadastro|Quero Participar/i,
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
