import { useState, useMemo } from "react";
import type { DrawWinnerItem, SortOption } from "@/types/participant.types";
import { Pagination } from "@/components/ui/Pagination";
import { WinnerDetailsModal } from "@/components/admin/WinnerDetailsModal";
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
  winners: DrawWinnerItem[];
  onNavigateToParticipants: () => void;
}

export function WinnersTable({
  winners,
  onNavigateToParticipants,
}: WinnersTableProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [drawFilter, setDrawFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewingWinner, setViewingWinner] = useState<DrawWinnerItem | null>(null);

  // Dynamic filter options
  const availableDraws = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>();
    winners.forEach((w) => {
      const title = w.drawTitle?.trim();
      if (!title) return;
      const current = map.get(title) || { title, count: 0 };
      current.count += 1;
      map.set(title, current);
    });
    return Array.from(map.values());
  }, [winners]);

  const availableUserTypes = useMemo(() => {
    const map = new Map<string, { type: string; count: number }>();
    winners.forEach((w) => {
      const type = (w.userType || "Lojista").trim();
      const current = map.get(type.toLowerCase()) || { type, count: 0 };
      current.count += 1;
      map.set(type.toLowerCase(), current);
    });
    return Array.from(map.values());
  }, [winners]);

  // Metrics
  const latestWinner = useMemo(() => {
    if (winners.length === 0) return null;
    return [...winners].sort(
      (a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime(),
    )[0];
  }, [winners]);

  // Filtering & Sorting
  const filtered = useMemo(() => {
    let list = [...winners];

    if (drawFilter !== "all") {
      list = list.filter((item) => item.drawTitle === drawFilter);
    }

    if (userTypeFilter !== "all") {
      list = list.filter(
        (item) =>
          (item.userType || "lojista").toLowerCase() ===
          userTypeFilter.toLowerCase(),
      );
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.store.toLowerCase().includes(q) ||
          item.drawTitle.toLowerCase().includes(q) ||
          item.prizeTitle.toLowerCase().includes(q) ||
          item.luckyNumber.includes(q) ||
          item.phone.includes(q) ||
          item.instagram.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      const dateA = new Date(a.wonAt).getTime();
      const dateB = new Date(b.wonAt).getTime();

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
  }, [winners, query, sortBy, drawFilter, userTypeFilter]);

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

  const hasActiveFilters = Boolean(
    query.trim() ||
      sortBy !== "recent" ||
      drawFilter !== "all" ||
      userTypeFilter !== "all",
  );

  function handleResetFilters() {
    setQuery("");
    setSortBy("recent");
    setDrawFilter("all");
    setUserTypeFilter("all");
    setCurrentPage(1);
  }

  function handleExportCSV() {
    exportWinnersToCSV(filtered);
  }

  return (
    <>
      <header className="stitch-header">
        <div>
          <h1>Resultados dos Sorteios</h1>
          <span className="stitch-status gold">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "15px" }}
            >
              workspace_premium
            </span>
            Histórico de Contemplados
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
      <div className="stitch-stats stitch-draw-stats">
        <div className="stitch-stat-card">
          <div className="stat-header">
            <span className="stat-label">Total de Premiações</span>
            <div className="stat-icon-badge">
              <span className="material-symbols-outlined">workspace_premium</span>
            </div>
          </div>
          <strong className="stat-value">{winners.length}</strong>
        </div>

        <div className="stitch-stat-card">
          <div className="stat-header">
            <span className="stat-label">Último Sorteio</span>
            <div className="stat-icon-badge">
              <span className="material-symbols-outlined">schedule</span>
            </div>
          </div>
          <strong className="stat-value stat-date-value">
            {latestWinner
              ? formatDate(latestWinner.wonAt)
              : "Nenhum ainda"}
          </strong>
        </div>
      </div>

      <div className="stitch-panel-card">
        <div className="stitch-controls-header">
          <div className="stitch-header-info">
            <div className="stitch-header-pill">
              <span className="material-symbols-outlined">workspace_premium</span>
              <span>Ganhadores</span>
              <span className="stitch-pill-count">{winners.length}</span>
            </div>
          </div>

          <div className="stitch-controls-meta">
            <button
              type="button"
              className="stitch-export-btn"
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              title="Exportar dados dos ganhadores para planilha CSV"
              aria-label="Exportar Planilha de Ganhadores"
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
              aria-label="Buscar sorteios e ganhadores"
              placeholder="Buscar por sorteio, prêmio, ganhador, loja ou número..."
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
            <span className="material-symbols-outlined">workspace_premium</span>
            <select
              aria-label="Filtrar por sorteio"
              value={drawFilter}
              onChange={(e) => {
                setDrawFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Todos os Sorteios</option>
              {availableDraws.map((d) => (
                <option key={d.title} value={d.title}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div className="stitch-sort-box">
            <span className="material-symbols-outlined">badge</span>
            <select
              aria-label="Filtrar por perfil"
              value={userTypeFilter}
              onChange={(e) => {
                setUserTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Todos os Perfis</option>
              {availableUserTypes.map((u) => (
                <option key={u.type} value={u.type} style={{ textTransform: "capitalize" }}>
                  {u.type.charAt(0).toUpperCase() + u.type.slice(1)}
                </option>
              ))}
            </select>
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
              <option value="name-asc">Ganhador (A - Z)</option>
              <option value="name-desc">Ganhador (Z - A)</option>
              <option value="number-asc">Número Sorteado (Menor)</option>
              <option value="number-desc">Número Sorteado (Maior)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="stitch-reset-btn"
              onClick={handleResetFilters}
              title="Limpar filtros"
              aria-label="Limpar filtros"
            >
              <span className="material-symbols-outlined">filter_alt_off</span>
            </button>
          )}
        </div>

        {/* Standardized Table & Mobile Cards */}
        {filtered.length > 0 ? (
          <>
            <div className="stitch-table-desktop">
              <table>
                <thead>
                  <tr>
                    <th>Sorteio</th>
                    <th>Ganhador</th>
                    <th>Loja</th>
                    <th>Contato</th>
                    <th>Data da apuração</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWinners.map((item) => (
                    <tr key={`${item.drawId}-${item.id}`}>
                      <td className="stitch-lucky-number-col">
                        <button
                          type="button"
                          onClick={() => setViewingWinner(item)}
                          title={`Ver detalhes da premiação (#${item.luckyNumber} - ${item.drawTitle})`}
                          aria-label={`Ver detalhes da premiação de ${item.name}`}
                          style={{
                            display: "inline-grid",
                            placeItems: "center",
                            width: "32px",
                            height: "32px",
                            border: "1px solid #e0d6cb",
                            borderRadius: "6px",
                            background: "#fff",
                            color: "#8c6414",
                            cursor: "pointer",
                            transition: "all 0.16s ease",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                            workspace_premium
                          </span>
                        </button>
                      </td>
                      <td className="stitch-name">
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "#201416",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.name}
                        </div>
                        {item.userType && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#8c6414",
                              fontWeight: 600,
                              textTransform: "capitalize",
                            }}
                          >
                            {item.userType}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: "13px", color: "#4b5563" }}>
                        {item.store}
                      </td>
                      <td>
                        <div className="stitch-contacts">
                          {item.phone && (
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
                          )}
                          {item.instagram && (
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
                          )}
                        </div>
                      </td>
                      <td
                        style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}
                      >
                        {formatDate(item.wonAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dedicated Mobile Cards */}
            <div className="stitch-cards-mobile">
              {paginatedWinners.map((item) => (
                <article key={`${item.drawId}-${item.id}`} className="participant-card-m">
                  <div className="pcm-header">
                    <div className="pcm-user">
                      <h3 className="pcm-name">{item.name}</h3>
                      {item.userType && (
                        <span className="pcm-tag">{item.userType}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="pcm-ticket-btn"
                      onClick={() => setViewingWinner(item)}
                      title={`Ver detalhes da premiação (#${item.luckyNumber} - ${item.drawTitle})`}
                      aria-label={`Ver detalhes da premiação de ${item.name}`}
                    >
                      <span className="material-symbols-outlined">confirmation_number</span>
                    </button>
                  </div>

                  <div className="pcm-meta">
                    <div className="pcm-store">
                      <span className="material-symbols-outlined">storefront</span>
                      <span>{item.store || "—"}</span>
                    </div>

                    <div className="pcm-date">
                      <span className="material-symbols-outlined">schedule</span>
                      <span>{formatDate(item.wonAt)}</span>
                    </div>
                  </div>

                  <div className="pcm-footer">
                    <div className="pcm-contacts stitch-contacts">
                      {item.phone && (
                        <a
                          className="social-icon whatsapp"
                          href={buildWhatsAppUrl(item.phone, item.name, item.store)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`WhatsApp de ${item.name}`}
                          title={`WhatsApp: ${formatPhone(item.phone)}`}
                        >
                          <img src="https://cdn.simpleicons.org/whatsapp/128C7E" alt="" />
                        </a>
                      )}
                      {item.instagram && (
                        <a
                          className="social-icon instagram"
                          href={buildInstagramUrl(item.instagram)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Instagram de ${item.name}`}
                          title={`@${cleanInstagramHandle(item.instagram)}`}
                        >
                          <img src="https://cdn.simpleicons.org/instagram/E1306C" alt="" />
                        </a>
                      )}
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "#fbf3dc",
                        border: "1px solid #e0ce9e",
                        color: "#78530b",
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                        workspace_premium
                      </span>
                      <span>{item.drawTitle}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
            <div className="winners-empty">
              <span className="material-symbols-outlined">workspace_premium</span>
              <h2>
                {winners.length
                  ? "Nenhum resultado encontrado com os filtros atuais"
                  : "Nenhum sorteio realizado ainda"}
              </h2>
              <p>
                {winners.length
                  ? "Tente buscar por outro termo ou limpe os filtros para ver a lista completa."
                  : "Assim que um sorteio for realizado no telão, o resultado aparecerá registrado aqui."}
              </p>
              {!winners.length && (
                <DrawTransitionLink className="stitch-button filled">
                  <span className="material-symbols-outlined">confirmation_number</span>
                  Realizar Primeiro Sorteio
                </DrawTransitionLink>
              )}
            </div>
          )}

        {filtered.length > 0 && (
          <Pagination
            currentPage={validCurrentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50]}
            itemLabel="resultados"
          />
        )}
      </div>

      <WinnerDetailsModal
        winner={viewingWinner}
        isOpen={Boolean(viewingWinner)}
        onClose={() => setViewingWinner(null)}
      />
    </>
  );
}
