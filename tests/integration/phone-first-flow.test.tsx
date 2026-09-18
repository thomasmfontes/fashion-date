import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RootLandingPage from "@/app/page";
import { resetInMemStore } from "@/tests/mocks/cloudflare-workers";
import { participantService } from "@/services/participantService";
import { ApiError } from "@/services/apiClient";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

describe("Component Integration: Phone-First Smart Routing on Landing Page", () => {
  beforeEach(() => {
    resetInMemStore();
    sessionStorage.clear();
    localStorage.clear();
    mockPush.mockClear();
    mockReplace.mockClear();
    vi.restoreAllMocks();
  });

  it("PHONE-01: renders WhatsApp input and handles unregistered number by redirecting to /inscricao", async () => {
    const user = userEvent.setup();

    vi.spyOn(participantService, "lookupByPhone").mockRejectedValue(
      new ApiError("Nenhuma inscrição encontrada com este WhatsApp.", 404),
    );

    render(<RootLandingPage />);

    const phoneInput = screen.getByLabelText(/Informe seu WhatsApp/i);
    const submitBtn = screen.getByRole("button", { name: /Continuar/i });

    expect(phoneInput).toBeDefined();

    await user.type(phoneInput, "11987654321");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/inscricao?phone=11987654321");
    });
  });

  it("PHONE-02: handles already registered number by saving session and redirecting to /home", async () => {
    const user = userEvent.setup();

    const mockParticipant = {
      id: 77,
      name: "Sabrina Sato",
      store: "Sato Store",
      city: "São Paulo - SP",
      phone: "11988887777",
      instagram: "@sabrinasato",
      luckyNumber: "0077",
      createdAt: "2026-08-21T10:00:00Z",
      wonAt: null,
      tickets: [],
    };

    vi.spyOn(participantService, "lookupByPhone").mockResolvedValue({
      ok: true,
      participant: mockParticipant,
    });

    render(<RootLandingPage />);

    const phoneInput = screen.getByLabelText(/Informe seu WhatsApp/i);
    const submitBtn = screen.getByRole("button", { name: /Continuar/i });

    await user.type(phoneInput, "11988887777");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/home");
    });

    // Check localStorage saved
    const saved = localStorage.getItem("fashion_date_registered_user");
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.name).toBe("Sabrina Sato");
    expect(parsed.phone).toBe("11988887777");
  });

  it("PHONE-03: validates phone length and displays error when incomplete", async () => {
    const user = userEvent.setup();

    render(<RootLandingPage />);

    const phoneInput = screen.getByLabelText(/Informe seu WhatsApp/i);
    const submitBtn = screen.getByRole("button", { name: /Continuar/i });

    await user.type(phoneInput, "1198");
    await user.click(submitBtn);

    expect(screen.getByText(/Informe um WhatsApp com DDD válido/i)).toBeDefined();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
