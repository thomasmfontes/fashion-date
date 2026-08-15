import type { StatusFilter, SortOption } from "@/types/participant.types";

interface AdminControlsProps {
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  totalCount: number;
  activeCount: number;
  winnerCount: number;
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
  statusFilter,
  onStatusChange,
  totalCount,
  activeCount,
  winnerCount,
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
        <div className="stitch-segmented" role="tablist" aria-label="Filtro por status">
          <button
            type="button"
            className={`stitch-seg-btn${statusFilter === "all" ? " active" : ""}`}
            onClick={() => onStatusChange("all")}
            role="tab"
            aria-selected={statusFilter === "all"}
          >
            <span>Todos</span>
            <small>{totalCount}</small>
          </button>
          <button
            type="button"
            className={`stitch-seg-btn${statusFilter === "active" ? " active" : ""}`}
            onClick={() => onStatusChange("active")}
            role="tab"
            aria-selected={statusFilter === "active"}
          >
            <span>Ativos</span>
            <small>{activeCount}</small>
          </button>
          <button
            type="button"
            className={`stitch-seg-btn${statusFilter === "winner" ? " active" : ""}`}
            onClick={() => onStatusChange("winner")}
            role="tab"
            aria-selected={statusFilter === "winner"}
          >
            <span>Sorteados</span>
            <small>{winnerCount}</small>
          </button>
        </div>

        <div className="stitch-controls-meta">
          <span className="stitch-count-label">
            Exibindo <strong>{filteredCount}</strong> de {totalCount}
          </span>
          <button
            type="button"
            className="stitch-export-btn"
            onClick={onExportCSV}
            title="Exportar dados filtrados para planilha CSV"
          >
            <span className="material-symbols-outlined">download</span>
            <span>Exportar CSV</span>
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
            title="Restaurar todos os filtros"
          >
            <span className="material-symbols-outlined">filter_alt_off</span>
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>
    </>
  );
}
