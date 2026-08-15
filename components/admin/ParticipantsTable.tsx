import { useState, useMemo } from "react";
import type { Participant } from "@/types/participant.types";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
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
      <div className="stitch-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nº da sorte</th>
              <th>Participante</th>
              <th>Loja</th>
              <th>Contato</th>
              <th>Data de inscrição</th>
              <th>Situação</th>
              <th className="stitch-actions-col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedParticipants.map((item) => (
              <tr key={item.id}>
                <td data-label="Nº da sorte">
                  <strong>{item.luckyNumber}</strong>
                </td>
                <td data-label="Participante" className="stitch-name">
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
                <td data-label="Data de inscrição">
                  {formatDate(item.createdAt)}
                </td>
                <td data-label="Situação">
                  {item.wonAt ? (
                    <Badge variant="winner">Vencedor</Badge>
                  ) : (
                    <Badge variant="active">Inscrito</Badge>
                  )}
                </td>
                <td data-label="Ações" className="stitch-actions-col">
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

      <Pagination
        currentPage={validCurrentPage}
        totalItems={participants.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 25, 50]}
        itemLabel="participantes"
      />
    </>
  );
}
