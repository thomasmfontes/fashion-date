import type { ParticipantStats } from "@/types/participant.types";

interface AdminMetricsProps {
  stats: ParticipantStats;
}

export function AdminMetrics({ stats }: AdminMetricsProps) {
  return (
    <div className="stitch-stats">
      <div className="stitch-stat-card">
        <div>
          <span>Total de Participantes</span>
          <b className="material-symbols-outlined">group</b>
        </div>
        <strong>{stats.total}</strong>
      </div>

      <div className="stitch-stat-card">
        <div>
          <span>Cadastros Hoje</span>
          <b className="material-symbols-outlined">person_add</b>
        </div>
        <strong>{stats.today}</strong>
      </div>

      <div className="stitch-stat-card">
        <div>
          <span>Sorteados</span>
          <b className="material-symbols-outlined">workspace_premium</b>
        </div>
        <strong>{stats.winners}</strong>
      </div>
    </div>
  );
}
