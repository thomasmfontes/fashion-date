import type { ReactNode } from "react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = "itens",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  function getPageNumbers(): (number | string)[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="stitch-pagination" aria-label="Navegação da tabela">
      <div className="stitch-pagination-info">
        <span>
          Mostrando <strong>{startItem}</strong> a <strong>{endItem}</strong> de{" "}
          <strong>{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="stitch-page-size-picker">
            <label htmlFor="stitch-page-size">Exibir:</label>
            <select
              id="stitch-page-size"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} por página
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="stitch-pagination-controls">
        <button
          type="button"
          className="stitch-page-btn arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <span className="material-symbols-outlined">chevron_left</span>
          <span>Anterior</span>
        </button>

        <div className="stitch-page-numbers">
          {getPageNumbers().map((page, index): ReactNode => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${index}`} className="stitch-page-ellipsis">
                  &hellip;
                </span>
              );
            }

            const pageNum = Number(page);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                className={`stitch-page-num${isActive ? " active" : ""}`}
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Ir para página ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="stitch-page-btn arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Próxima página"
          title="Próxima página"
        >
          <span>Próxima</span>
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
