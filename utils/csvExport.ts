import type { Participant } from "@/types/participant.types";

export function exportParticipantsToCSV(
  participants: Participant[],
  filename = `participantes-fashion-date-${new Date().toISOString().slice(0, 10)}.csv`,
): void {
  const headers = [
    "Número da Sorte",
    "Nome",
    "Loja",
    "WhatsApp",
    "Instagram",
    "Data de Inscrição",
    "Status",
  ];

  const rows = participants.map((p) => [
    `"${p.luckyNumber}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.store.replace(/"/g, '""')}"`,
    `"${p.phone}"`,
    `"${p.instagram.replace(/"/g, '""')}"`,
    `"${new Date(p.createdAt).toLocaleString("pt-BR")}"`,
    `"${p.wonAt ? "Vencedor" : "Inscrito"}"`,
  ]);

  downloadCSV(headers, rows, filename);
}

export function exportWinnersToCSV(
  winners: Participant[],
  filename = `ganhadores-provador-fashion-${new Date().toISOString().slice(0, 10)}.csv`,
): void {
  const headers = [
    "Número da Sorte",
    "Ganhador",
    "Loja",
    "WhatsApp",
    "Instagram",
    "Data do Sorteio",
    "Situação",
  ];

  const rows = winners.map((p) => [
    `"${p.luckyNumber}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.store.replace(/"/g, '""')}"`,
    `"${p.phone}"`,
    `"${p.instagram.replace(/"/g, '""')}"`,
    `"${new Date(p.wonAt || p.createdAt).toLocaleString("pt-BR")}"`,
    `"Contemplado"`,
  ]);

  downloadCSV(headers, rows, filename);
}

function downloadCSV(headers: string[], rows: string[][], filename: string): void {
  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
