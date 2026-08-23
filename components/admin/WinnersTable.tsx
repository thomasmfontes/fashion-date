import { useState, useMemo } from "react";
import type { Participant, SortOption } from "@/types/participant.types";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import {
  formatDate,
  formatPhone,
  buildWhatsAppUrl,
  buildInstagramUrl,
  cleanInstagramHandle,
} from "@/utils/formatters";
import { exportWinnersToCSV } from "@/utils/csvExport";
import { DrawTransitionLink } from "@/components/admin/DrawTransitionLink";

interface WinnersTableProps {
  winners: Participant[];
  onNavigateToParticipants: () => void;
}

export function WinnersTable({
  winners,
  onNavigateToParticipants,
}: WinnersTableProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Metrics
  const uniqueStoresCount = useMemo(() => {
    const stores = new Set(winners.map((w) => w.store.trim().toLowerCase()));
    return stores.size;
  }, [winners]);

  const latestWinner = useMemo(() => {
    if (winners.length === 0) return null;
    return [...winners].sort(
      (a, b) =>
        new Date(b.wonAt || b.createdAt).getTime() -
        new Date(a.wonAt || a.createdAt).getTime(),
    )[0];
  }, [winners]);

  // Filtering & Sorting
  const filtered = useMemo(() => {
    let list = [...winners];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.store.toLowerCase().includes(q) ||
          item.luckyNumber.includes(q) ||
          item.phone.includes(q) ||
          item.instagram.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      const dateA = new Date(a.wonAt || a.createdAt).getTime();
      const dateB = new Date(b.wonAt || b.createdAt).getTime();

      switch (sortBy) {
        case "oldest":
          return dateA - dateB;
        case "name-asc":
          return a.name.localeCompare(b.name, "pt-BR");
        case "name-desc":
          return b.name.localeCompare(a.name, "pt-BR");
        case "number-asc":
          return a.luckyNumber.localeCompare(b.luckyNumber);
        case "number-desc":
          return b.luckyNumber.localeCompare(a.luckyNumber);
        case "recent":
        default:
          return dateB - dateA;
      }
    });

    return list;
  }, [winners, query, sortBy]);

  // Paginated items
  const paginatedWinners = useMemo(() => {
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const validCurrentPage = useMemo(() => {
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    return Math.min(currentPage, totalPages);
  }, [filtered.length, currentPage, pageSize]);

  const hasActiveFilters = Boolean(query.trim() || sortBy !== "recent");

  function handleResetFilters() {
    setQuery("");
    setSortBy("recent");
    setCurrentPage(1);
  }

  function handleExportCSV() {
    exportWinnersToCSV(filtered);
  }

  return (
    <>
      <header className="stitch-header">
        <div>
          <h1>Ganhadores do Provador Fashion</h1>
          <span className="stitch-status gold">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "15px" }}
            >
              workspace_premium
            </span>
            Histórico Oficial de Sorteios
          </span>
        </div>
        <div className="stitch-actions">
          <button
            className="stitch-button outline"
            type="button"
            onClick={onNavigateToParticipants}
          >
            <span className="material-symbols-outlined">group</span>
            Ver Participantes
          </button>
          <DrawTransitionLink className="stitch-button filled">
            <span className="material-symbols-outlined">confirmation_number</span>
            Novo Sorteio
          </DrawTransitionLink>
        </div>
      </header>

      {/* Standardized Metrics Cards */}
      <div className="stitch-stats">
        <div className="stitch-stat-card">
          <div>
            <span>Total de Ganhadores</span>
            <b className="material-symbols-outlined">workspace_premium</b>
          </div>
          <strong>{winners.length}</strong>
        </div>

        <div className="stitch-stat-card">
          <div>
            <span>Lojas Premiadas</span>
            <b className="material-symbols-outlined">storefront</b>
          </div>
          <strong>{uniqueStoresCount}</strong>
        </div>

        <div className="stitch-stat-card">
          <div>
            <span>Último Sorteio</span>
            <b className="material-symbols-outlined">schedule</b>
          </div>
          <strong style={{ fontSize: latestWinner ? "16px" : "28px", marginTop: "14px" }}>
            {latestWinner
              ? formatDate(latestWinner.wonAt || latestWinner.createdAt)
              : "Nenhum ainda"}
          </strong>
        </div>
      </div>

      <div className="stitch-panel-card">
        {/* Standardized Controls & Search Toolbar */}
        <div className="stitch-controls-header">
          <span className="stitch-count-label">
            Exibindo <strong>{filtered.length}</strong> de {winners.length} ganhadores
          </span>
          <button
            type="button"
            className="stitch-export-btn"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            title="Exportar dados filtrados dos ganhadores para planilha CSV"
          >
            <span className="material-symbols-outlined">download</span>
            <span>Exportar Planilha</span>
          </button>
        </div>

        <div className="stitch-controls-inputs">
          <div className="stitch-search-box">
            <span className="material-symbols-outlined">search</span>
            <input
              aria-label="Buscar ganhadores"
              placeholder="Buscar por nome, loja, WhatsApp ou número da sorte..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {query && (
              <button
                type="button"
                className="stitch-search-clear"
                onClick={() => {
                  setQuery("");
                  setCurrentPage(1);
                }}
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
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
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
              onClick={handleResetFilters}
              title="Restaurar todos os filtros"
            >
              <span className="material-symbols-outlined">filter_alt_off</span>
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* Standardized Table */}
        <div className="stitch-table-wrap">
          {filtered.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Nº da sorte</th>
                  <th>Ganhador</th>
                  <th>Loja</th>
                  <th>Contato</th>
                  <th>Data do sorteio</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {paginatedWinners.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Nº da sorte">
                      <strong>{item.luckyNumber}</strong>
                    </td>
                    <td data-label="Ganhador" className="stitch-name">
                      {item.name}
                    </td>
                    <td data-label="Loja">{item.store}</td>
                    <td data-label="Contato">
                      <div className="stitch-contacts">
                        <a
                          className="social-icon whatsapp"
                          href={buildWhatsAppUrl(item.phone, item.name, item.store)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Abrir WhatsApp de ${item.name}`}
                          title={`WhatsApp: ${formatPhone(item.phone)}`}
                        >
                          <img
                            src="https://cdn.simpleicons.org/whatsapp/128C7E"
                            alt=""
                          />
                        </a>
                        <a
                          className="social-icon instagram"
                          href={buildInstagramUrl(item.instagram)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Abrir Instagram de ${item.name}`}
                          title={`@${cleanInstagramHandle(item.instagram)}`}
                        >
                          <img
                            src="https://cdn.simpleicons.org/instagram/E1306C"
                            alt=""
                          />
                        </a>
                      </div>
                    </td>
                    <td data-label="Data do sorteio">
                      {formatDate(item.wonAt || item.createdAt)}
                    </td>
                    <td data-label="Situação">
                      <Badge variant="winner">Contemplado</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="winners-empty">
              <span className="material-symbols-outlined">workspace_premium</span>
              <h2>
                {winners.length
                  ? "Nenhum ganhador encontrado com os filtros atuais"
                  : "Nenhum sorteio realizado ainda"}
              </h2>
              <p>
                {winners.length
                  ? "Tente buscar por outro termo ou limpe os filtros para ver a lista completa."
                  : "Assim que o primeiro sorteio for realizado no telão, o ganhador aparecerá registrado aqui."}
              </p>
              {!winners.length && (
                <DrawTransitionLink className="stitch-button filled">
                  <span className="material-symbols-outlined">confirmation_number</span>
                  Realizar Primeiro Sorteio
                </DrawTransitionLink>
              )}
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <Pagination
            currentPage={validCurrentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50]}
            itemLabel="ganhadores"
          />
        )}
      </div>
    </>
  );
}
