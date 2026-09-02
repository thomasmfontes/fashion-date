import type { ParticipantStats } from "@/types/participant.types";

interface AdminMetricsProps {
  stats: ParticipantStats;
}

export function AdminMetrics({ stats }: AdminMetricsProps) {
  return (
    <div className="stitch-stats stitch-draw-stats">
      <div className="stitch-stat-card">
        <div className="stat-header">
          <span className="stat-label">Total de Participantes</span>
          <div className="stat-icon-badge">
            <span className="material-symbols-outlined">group</span>
          </div>
        </div>
        <strong className="stat-value">{stats.total}</strong>
      </div>

      <div className="stitch-stat-card">
        <div className="stat-header">
          <span className="stat-label">Cadastros Hoje</span>
          <div className="stat-icon-badge">
            <span className="material-symbols-outlined">person_add</span>
          </div>
        </div>
        <strong className="stat-value">{stats.today}</strong>
      </div>
    </div>
  );
}
