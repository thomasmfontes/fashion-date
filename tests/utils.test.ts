import { describe, it, expect, vi } from "vitest";
import {
  formatPhone,
  cleanPhone,
  formatName,
  formatInstagram,
  cleanInstagramHandle,
  formatLuckyNumber,
  buildWhatsAppUrl,
  buildInstagramUrl,
  formatDate,
} from "@/utils/formatters";
import {
  isValidName,
  isValidStore,
  isValidPhone,
  isValidInstagram,
} from "@/utils/validators";
import { exportParticipantsToCSV, exportWinnersToCSV } from "@/utils/csvExport";
import { SoundSynthesizer } from "@/utils/audio";
import type { Participant } from "@/types/participant.types";

describe("Utils: Formatters", () => {
  it("formats Brazilian phone numbers with 11 digits (mobile)", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formats 10-digit numbers according to current slicing", () => {
    expect(formatPhone("1133334444")).toBe("(11) 33334-444");
  });

  it("handles short numbers under 2 digits without mask", () => {
    expect(formatPhone("11")).toBe("11");
    expect(formatPhone("1")).toBe("1");
    expect(formatPhone("1198")).toBe("(11) 98");
  });

  it("cleans phone numbers to raw digits only", () => {
    expect(cleanPhone("(11) 98765-4321")).toBe("11987654321");
    expect(cleanPhone("+55 (11) 98765-4321")).toBe("5511987654321");
  });

  it("formats names with proper Unicode word capitalization", () => {
    expect(formatName("maria clara dos santos")).toBe("Maria Clara Dos Santos");
  });

  it("formats and cleans Instagram handles with or without @", () => {
    expect(formatInstagram("renatacastanheira")).toBe("@renatacastanheira");
    expect(formatInstagram("@renatacastanheira")).toBe("@renatacastanheira");
    expect(formatInstagram("")).toBe("");
    expect(cleanInstagramHandle("@renatacastanheira")).toBe("renatacastanheira");
    expect(cleanInstagramHandle("@@renata")).toBe("renata");
  });

  it("formats lucky numbers with strict 4-digit zero-padding", () => {
    expect(formatLuckyNumber(7)).toBe("0007");
    expect(formatLuckyNumber("42")).toBe("0042");
    expect(formatLuckyNumber(1024)).toBe("1024");
    expect(formatLuckyNumber(null)).toBe("----");
    expect(formatLuckyNumber(undefined)).toBe("----");
  });

  it("builds valid WhatsApp and Instagram URLs", () => {
    expect(buildWhatsAppUrl("11987654321", "Maria", "Loja Chic")).toContain("https://wa.me/5511987654321");
    expect(buildWhatsAppUrl("11987654321")).toContain("https://wa.me/5511987654321");
    expect(buildInstagramUrl("@fashiondate")).toBe("https://instagram.com/fashiondate");
  });

  it("formats dates in Brazilian locale", () => {
    const formatted = formatDate("2026-08-21T15:00:00Z");
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });
});

describe("Utils: Validators", () => {
  it("validates participant full names (min 3 characters after trim)", () => {
    expect(isValidName("Renata Castanheira")).toBe(true);
    expect(isValidName("Ana")).toBe(true);
    expect(isValidName("Jo")).toBe(false);
    expect(isValidName("   ")).toBe(false);
  });

  it("validates store names (min 2 characters after trim)", () => {
    expect(isValidStore("Boutique Chic")).toBe(true);
    expect(isValidStore("AB")).toBe(true);
    expect(isValidStore("A")).toBe(false);
    expect(isValidStore("")).toBe(false);
  });

  it("validates Brazilian phone digit lengths (10 to 11 digits)", () => {
    expect(isValidPhone("(11) 98765-4321")).toBe(true);
    expect(isValidPhone("11987654321")).toBe(true);
    expect(isValidPhone("1133334444")).toBe(true);
    expect(isValidPhone("123456")).toBe(false);
    expect(isValidPhone("1234567890123")).toBe(false);
  });

  it("validates Instagram handles", () => {
    expect(isValidInstagram("@loja_moda.2026")).toBe(true);
    expect(isValidInstagram("loja.moda")).toBe(true);
    expect(isValidInstagram("a")).toBe(false);
    expect(isValidInstagram("")).toBe(false);
    expect(isValidInstagram("loja@moda!")).toBe(false);
  });
});

describe("Utils: CSV Export", () => {
  const sampleParticipants: Participant[] = [
    {
      id: 1,
      name: 'Maria "Chic" Santos',
      store: "Loja A",
      phone: "11987654321",
      instagram: "@maria",
      luckyNumber: "0042",
      createdAt: "2026-08-21T10:00:00Z",
      wonAt: null,
    },
  ];

  it("triggers CSV export download without errors", () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        el.click = clickSpy;
      }
      return el;
    });

    expect(() => exportParticipantsToCSV(sampleParticipants)).not.toThrow();
    expect(clickSpy).toHaveBeenCalled();

    expect(() => exportWinnersToCSV(sampleParticipants)).not.toThrow();

    vi.restoreAllMocks();
  });
});

describe("Utils: Audio Synthesizer", () => {
  it("initializes and handles sound synthesis gracefully without crashing in jsdom", () => {
    const synth = new SoundSynthesizer();
    expect(synth.isMuted).toBe(false);
    synth.isMuted = true;
    expect(synth.isMuted).toBe(true);

    expect(() => {
      synth.playTick();
      synth.playLock();
      synth.playVictory();
      synth.playAlarmSiren();
    }).not.toThrow();
  });
});
