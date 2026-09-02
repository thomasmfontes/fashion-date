import type { StatusFilter, SortOption } from "@/types/participant.types";

interface AdminControlsProps {
  statusFilter?: StatusFilter;
  onStatusChange?: (status: StatusFilter) => void;
  userTypeFilter: string;
  onUserTypeChange: (type: string) => void;
  availableUserTypes: string[];
  totalCount: number;
  activeCount?: number;
  winnerCount?: number;
  filteredCount: number;
  query: string;
  onQueryChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onExportCSV: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export function AdminControls({
  userTypeFilter,
  onUserTypeChange,
  availableUserTypes,
  totalCount,
  filteredCount,
  query,
  onQueryChange,
  sortBy,
  onSortChange,
  onExportCSV,
  onResetFilters,
  hasActiveFilters,
}: AdminControlsProps) {
  return (
    <>
      <div className="stitch-controls-header">
        <div className="stitch-header-info">
          <div className="stitch-header-pill">
            <span className="material-symbols-outlined">group</span>
            <span>Participantes</span>
            <span className="stitch-pill-count">{totalCount}</span>
          </div>
        </div>

        <div className="stitch-controls-meta">
          <button
            type="button"
            className="stitch-export-btn"
            onClick={onExportCSV}
            disabled={filteredCount === 0}
            title="Exportar planilha CSV"
            aria-label="Exportar CSV"
          >
            <span className="material-symbols-outlined export-icon">download</span>
            <span className="export-text">Exportar</span>
            <small className="export-badge">CSV</small>
          </button>
        </div>
      </div>

      <div className="stitch-controls-inputs">
        <div className="stitch-search-box">
          <span className="material-symbols-outlined">search</span>
          <input
            aria-label="Buscar participantes"
            placeholder="Buscar por nome, loja, telefone ou número da sorte..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="stitch-search-clear"
              onClick={() => onQueryChange("")}
              aria-label="Limpar busca"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="stitch-sort-box">
          <span className="material-symbols-outlined">badge</span>
          <select
            aria-label="Filtrar por perfil"
            value={userTypeFilter}
            onChange={(e) => onUserTypeChange(e.target.value)}
          >
            <option value="all">Todos os Perfis</option>
            {availableUserTypes.map((u) => (
              <option key={u} value={u} style={{ textTransform: "capitalize" }}>
                {u.charAt(0).toUpperCase() + u.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="stitch-sort-box">
          <span className="material-symbols-outlined">swap_vert</span>
          <select
            aria-label="Ordenar por"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
          >
            <option value="recent">Mais Recentes</option>
            <option value="oldest">Mais Antigos</option>
            <option value="name-asc">Nome (A - Z)</option>
            <option value="name-desc">Nome (Z - A)</option>
            <option value="number-asc">Número (Menor)</option>
            <option value="number-desc">Número (Maior)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="stitch-reset-btn"
            onClick={onResetFilters}
            title="Limpar filtros"
            aria-label="Limpar filtros"
          >
            <span className="material-symbols-outlined">filter_alt_off</span>
          </button>
        )}
      </div>
    </>
  );
}
