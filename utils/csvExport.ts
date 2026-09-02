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

  const rows = participants.map((p) => {
    let ticketsStr = p.luckyNumber || "";
    if (p.tickets && p.tickets.length > 0) {
      ticketsStr = p.tickets
        .map((t) => (t.drawTitle ? `${t.drawTitle}: #${t.ticketNumber}` : `#${t.ticketNumber}`))
        .join("; ");
    }
    return [
      `"${ticketsStr.replace(/"/g, '""')}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.store.replace(/"/g, '""')}"`,
      `"${p.phone}"`,
      `"${p.instagram.replace(/"/g, '""')}"`,
      `"${new Date(p.createdAt).toLocaleString("pt-BR")}"`,
      `"${p.wonAt ? "Vencedor" : "Inscrito"}"`,
    ];
  });

  downloadCSV(headers, rows, filename);
}

export function exportWinnersToCSV(
  winners: (import("@/types/participant.types").DrawWinnerItem | Participant)[],
  filename = `ganhadores-sorteios-fashion-date-${new Date().toISOString().slice(0, 10)}.csv`,
): void {
  const headers = [
    "Sorteio",
    "Prêmio",
    "Número da Sorte",
    "Ganhador",
    "Perfil",
    "Loja",
    "WhatsApp",
    "Instagram",
    "Data da Apuração",
    "Situação",
  ];

  const rows = winners.map((item) => {
    const isDrawWinner = "drawTitle" in item;
    const drawTitle = isDrawWinner ? (item as import("@/types/participant.types").DrawWinnerItem).drawTitle : "Sorteio Oficial";
    const prizeTitle = isDrawWinner ? (item as import("@/types/participant.types").DrawWinnerItem).prizeTitle : "Prêmio";
    const userType = item.userType || "lojista";
    const wonDate =
      "wonAt" in item && item.wonAt
        ? item.wonAt
        : "createdAt" in item
          ? item.createdAt
          : new Date().toISOString();

    return [
      `"${drawTitle.replace(/"/g, '""')}"`,
      `"${prizeTitle.replace(/"/g, '""')}"`,
      `"${item.luckyNumber}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${userType}"`,
      `"${item.store.replace(/"/g, '""')}"`,
      `"${item.phone}"`,
      `"${item.instagram.replace(/"/g, '""')}"`,
      `"${new Date(wonDate).toLocaleString("pt-BR")}"`,
      `"Contemplado"`,
    ];
  });

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
