import { useState, useMemo } from "react";
import type { Participant } from "@/types/participant.types";
import { Pagination } from "@/components/ui/Pagination";
import { ParticipantTicketsModal } from "@/components/admin/ParticipantTicketsModal";
import {
  formatDate,
  formatPhone,
  buildWhatsAppUrl,
  buildInstagramUrl,
  cleanInstagramHandle,
} from "@/utils/formatters";

interface ParticipantsTableProps {
  participants: Participant[];
  totalParticipants?: number;
  onResetFilters?: () => void;
  onEdit: (participant: Participant) => void;
  onDelete: (participant: Participant) => void;
}

export function ParticipantsTable({
  participants,
  totalParticipants = 0,
  onResetFilters,
  onEdit,
  onDelete,
}: ParticipantsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewingTicketsParticipant, setViewingTicketsParticipant] = useState<Participant | null>(null);

  // Paginated items
  const paginatedParticipants = useMemo(() => {
    const totalPages = Math.ceil(participants.length / pageSize) || 1;
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * pageSize;
    return participants.slice(start, start + pageSize);
  }, [participants, currentPage, pageSize]);

  // Adjust page if filter/query reduced the total count
  const validCurrentPage = useMemo(() => {
    const totalPages = Math.ceil(participants.length / pageSize) || 1;
    return Math.min(currentPage, totalPages);
  }, [participants.length, currentPage, pageSize]);

  if (participants.length === 0) {
    const isFiltered = totalParticipants > 0;
    return (
      <div className="stitch-empty">
        <span className="material-symbols-outlined">
          {isFiltered ? "search_off" : "group_off"}
        </span>
        <h2>
          {isFiltered
            ? "Nenhum participante encontrado com os filtros atuais"
            : "Nenhum participante cadastrado ainda"}
        </h2>
        <p>
          {isFiltered
            ? "Tente buscar por outro termo ou limpe os filtros para ver a lista completa."
            : "Assim que os lojistas preencherem o formulário no evento, eles aparecerão registrados aqui em tempo real."}
        </p>
        {isFiltered && onResetFilters ? (
          <button
            type="button"
            className="stitch-button outline"
            onClick={onResetFilters}
          >
            <span className="material-symbols-outlined">refresh</span>
            Limpar Filtros
          </button>
        ) : (
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="stitch-button filled"
          >
            <span className="material-symbols-outlined">person_add</span>
            Abrir Formulário de Cadastro
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="stitch-table-desktop">
        <table>
          <thead>
            <tr>
              <th>Nº da sorte</th>
              <th>Participante</th>
              <th>Loja</th>
              <th>Contato</th>
              <th>Data de inscrição</th>
              <th className="stitch-actions-col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedParticipants.map((item) => (
              <tr key={item.id}>
                <td className="stitch-lucky-number-col">
                  {item.tickets && item.tickets.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setViewingTicketsParticipant(item)}
                      title={`Ver ${item.tickets.length} bilhete(s)`}
                      aria-label={`Ver bilhetes de ${item.name}`}
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
                        confirmation_number
                      </span>
                    </button>
                  ) : item.luckyNumber ? (
                    <button
                      type="button"
                      onClick={() => setViewingTicketsParticipant(item)}
                      title={`Ver bilhete #${item.luckyNumber}`}
                      aria-label={`Ver bilhete de ${item.name}`}
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
                        confirmation_number
                      </span>
                    </button>
                  ) : (
                    <span style={{ color: "#9ca3af", fontSize: "13px" }}>—</span>
                  )}
                </td>
                <td className="stitch-name">
                  <div>{item.name}</div>
                  {item.userType && (
                    <span style={{ fontSize: "11px", color: "#8c6414", fontWeight: 600, textTransform: "capitalize" }}>
                      {item.userType}
                    </span>
                  )}
                </td>
                <td>{item.store}</td>
                <td>
                  <div className="stitch-contacts">
                    <a
                      className="social-icon whatsapp"
                      href={buildWhatsAppUrl(item.phone, item.name, item.store)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Conversar no WhatsApp com ${item.name}`}
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
                      aria-label={`Instagram de ${item.name}`}
                      title={`Instagram: @${cleanInstagramHandle(item.instagram)}`}
                    >
                      <img
                        src="https://cdn.simpleicons.org/instagram/E1306C"
                        alt=""
                      />
                    </a>
                  </div>
                </td>
                <td>
                  {formatDate(item.createdAt)}
                </td>
                <td className="stitch-actions-col">
                  <div className="participant-actions">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      aria-label={`Editar cadastro de ${item.name}`}
                      title="Editar cadastro"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onDelete(item)}
                      aria-label={`Excluir cadastro de ${item.name}`}
                      title="Excluir cadastro"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modern Dedicated Mobile Cards */}
      <div className="stitch-cards-mobile">
        {paginatedParticipants.map((item) => (
          <article key={item.id} className="participant-card-m">
            <div className="pcm-header">
              <div className="pcm-user">
                <h3 className="pcm-name">{item.name}</h3>
                {item.userType && (
                  <span className="pcm-tag">{item.userType}</span>
                )}
              </div>

              {item.tickets && item.tickets.length > 0 ? (
                <button
                  type="button"
                  className="pcm-ticket-btn"
                  onClick={() => setViewingTicketsParticipant(item)}
                  title={`Ver ${item.tickets.length} bilhete(s)`}
                  aria-label={`Ver bilhetes de ${item.name}`}
                >
                  <span className="material-symbols-outlined">confirmation_number</span>
                  <span className="pcm-ticket-badge">{item.tickets.length}</span>
                </button>
              ) : item.luckyNumber ? (
                <button
                  type="button"
                  className="pcm-ticket-btn"
                  onClick={() => setViewingTicketsParticipant(item)}
                  title={`Ver bilhete #${item.luckyNumber}`}
                  aria-label={`Ver bilhete de ${item.name}`}
                >
                  <span className="material-symbols-outlined">confirmation_number</span>
                </button>
              ) : null}
            </div>

            <div className="pcm-meta">
              <div className="pcm-store">
                <span className="material-symbols-outlined">storefront</span>
                <span>{item.store || "—"}</span>
              </div>

              <div className="pcm-date">
                <span className="material-symbols-outlined">schedule</span>
                <span>{formatDate(item.createdAt)}</span>
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

              <div className="pcm-actions">
                <button
                  type="button"
                  className="action-icon edit"
                  onClick={() => onEdit(item)}
                  aria-label={`Editar ${item.name}`}
                  title="Editar participante"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button
                  type="button"
                  className="action-icon delete danger"
                  onClick={() => onDelete(item)}
                  aria-label={`Excluir ${item.name}`}
                  title="Excluir participante"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Pagination
        currentPage={validCurrentPage}
        totalItems={participants.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50]}
        itemLabel="participantes"
      />

      <ParticipantTicketsModal
        participant={viewingTicketsParticipant}
        isOpen={Boolean(viewingTicketsParticipant)}
        onClose={() => setViewingTicketsParticipant(null)}
      />
    </>
  );
}
