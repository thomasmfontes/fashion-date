import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { LiveSlotMachine } from "@/components/admin/LiveSlotMachine";

describe("Component Integration: Admin Authentication & Live Draw Flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("INT-ADMIN-01: handles admin password authentication and submission", async () => {
    const user = userEvent.setup();
    const handleLogin = vi.fn();

    render(<AdminLoginForm onLogin={handleLogin} />);

    const passwordInput = screen.getByLabelText(/Senha Mestra/i);
    const loginButton = screen.getByRole("button", {
      name: /Acessar Painel/i,
    });

    await user.type(passwordInput, "correct-admin-key");
    await user.click(loginButton);

    expect(handleLogin).toHaveBeenCalledWith("correct-admin-key");
  });

  it("INT-ADMIN-02: admin header toggles registrations status and exposes live draw transition", async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();

    render(
      <AdminHeader
        registrationsOpen={true}
        onToggleRegistrations={handleToggle}
      />,
    );

    const toggleBtn = screen.getByRole("button", {
      name: /Encerrar Inscrições/i,
    });
    await user.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);

    const drawLink = screen.getByRole("link", {
      name: /Abrir Telão|Iniciar Sorteio/i,
    });
    expect(drawLink).toBeDefined();
    expect(drawLink.getAttribute("href")).toBe("/admin/sorteio");
  });

  it("INT-ADMIN-03: slot machine renders digits and animation states", () => {
    render(
      <LiveSlotMachine
        digits={[
          { digit: "0", isSpinning: false, isLocked: true },
          { digit: "7", isSpinning: false, isLocked: true },
          { digit: "8", isSpinning: false, isLocked: true },
          { digit: "9", isSpinning: false, isLocked: true },
        ]}
      />,
    );

    expect(screen.getByText("0")).toBeDefined();
    expect(screen.getByText("7")).toBeDefined();
    expect(screen.getByText("8")).toBeDefined();
    expect(screen.getByText("9")).toBeDefined();
  });
});
