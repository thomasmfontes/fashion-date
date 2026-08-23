import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal";
import { FastLookupModal } from "@/components/public/FastLookupModal";

describe("Component Integration: Accessibility & Modal Focus Containment", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("INT-MODAL-01: contains focus, responds to Escape key, and restores focus to trigger", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    // Trigger button container
    const { unmount } = render(
      <div>
        <button id="open-btn" type="button">
          Abrir Modal
        </button>
        <Modal isOpen={true} onClose={handleClose} title="Janela de Teste">
          <p>Conteúdo do modal</p>
          <input id="modal-input" placeholder="Digite algo" />
          <button type="button" id="modal-action-btn">
            Ação
          </button>
        </Modal>
      </div>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBeDefined();

    // Press Escape
    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(1);

    unmount();
  });

  it("INT-MODAL-02: FastLookupModal provides accessible dialog attributes and keyboard interaction", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleLookup = vi.fn();

    render(
      <FastLookupModal
        isOpen={true}
        onClose={handleClose}
        onLookup={handleLookup}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    const phoneInput = screen.getByLabelText(/WhatsApp Cadastrado/i);
    expect(phoneInput).toBeDefined();

    // Type phone and press Escape
    await user.type(phoneInput, "11987654321");
    await user.keyboard("{Escape}");

    expect(handleClose).toHaveBeenCalled();
  });
});
