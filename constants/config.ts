export const APP_CONFIG = {
  name: "Fashion Date",
  edition: "2026",
  organizer: "Renata Castanheira - Crente Chic",
  prizeDescription: "Provador Fashion com Renata Castanheira",
  routes: {
    home: "/",
    success: "/sucesso",
    duplicate: "/cadastro-duplicado",
    photos: "/fotos",
    admin: "/admin",
    adminWinners: "/admin/vencedores",
    adminDraw: "/admin/sorteio",
  },
  api: {
    participants: "/api/participants",
    adminParticipants: "/api/admin/participants",
    adminSettings: "/api/admin/settings",
    adminDraw: "/api/admin/draw",
    adminExport: "/api/admin/export",
    liveDraw: "/api/live-draw",
  },
} as const;
