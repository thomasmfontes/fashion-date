"use client";

import { useState, type MouseEvent } from "react";
import type { AdminView, Participant } from "@/types/participant.types";
import { useAuth } from "@/hooks/useAuth";
import { useParticipants } from "@/hooks/useParticipants";
import { useToast } from "@/hooks/useToast";
import { participantService } from "@/services/participantService";
import { ApiError } from "@/services/apiClient";
import { drawService } from "@/services/drawService";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Footer } from "@/components/layout/Footer";
import { AdminMetrics } from "@/components/admin/AdminMetrics";
import { AdminControls } from "@/components/admin/AdminControls";
import { ParticipantsTable } from "@/components/admin/ParticipantsTable";
import { WinnersTable } from "@/components/admin/WinnersTable";
import { DrawConfigPanel } from "@/components/admin/DrawConfigPanel";
import { EditParticipantModal } from "@/components/admin/EditParticipantModal";
import { DeleteParticipantModal } from "@/components/admin/DeleteParticipantModal";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Toast } from "@/components/ui/toast";
import { AuthLoadingScreen } from "@/components/public/AuthLoadingScreen";

export function AdminDashboard({
  initialView = "participants",
}: {
  initialView?: AdminView;
} = {}) {
  const { adminKey, isAuthenticated, isReady, login, logout } = useAuth();
  const { toast, showToast, dismissToast } = useToast();
  const [loginError, setLoginError] = useState("");
  const [view, setView] = useState<AdminView>(initialView);

  const {
    participants,
    filteredParticipants,
    winners,
    stats,
    registrationsOpen,
    setRegistrationsOpen,
    loading,
    error: participantsError,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    userTypeFilter,
    setUserTypeFilter,
    availableUserTypes,
    sortBy,
    setSortBy,
    exportToCSV,
    updateLocalParticipant,
    removeLocalParticipant,
  } = useParticipants(adminKey, logout);

  async function handleLogin(key: string) {
    setLoginError("");
    try {
      await participantService.getAll(key);
      login(key);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setLoginError("Senha incorreta. Confira e tente novamente.");
      } else {
        setLoginError("Não foi possível acessar o painel agora. Tente novamente.");
      }
    }
  }

  // Modals state
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);

  // Navigation handler
  function handleNavigate(nextView: AdminView, event?: MouseEvent<HTMLAnchorElement>) {
    event?.preventDefault();
    if (nextView === view) return;
    history.pushState(
      {},
      "",
      nextView === "winners" ? "/admin/vencedores" : "/admin",
    );
    setView(nextView);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Toggle registrations
  async function handleToggleRegistrations() {
    const next = !registrationsOpen;
    setRegistrationsOpen(next);
    try {
      await drawService.updateSettings(adminKey, { registrationsOpen: next });
      showToast(`Inscrições ${next ? "abertas" : "encerradas"} com sucesso.`);
    } catch {
      setRegistrationsOpen(!next);
      showToast("Não foi possível alterar as inscrições.", "error");
    }
  }

  // Save edited participant
  async function handleSaveEdit(data: {
    id: number;
    name: string;
    store: string;
    phone: string;
    instagram: string;
  }) {
    await participantService.update(adminKey, data);
    updateLocalParticipant(data);
    showToast("Cadastro atualizado com sucesso.");
  }

  // Confirm delete participant
  async function handleConfirmDelete(id: number) {
    try {
      await participantService.delete(adminKey, id);
      removeLocalParticipant(id);
      showToast("Participante removido com sucesso.");
    } catch {
      showToast("Não foi possível excluir o participante.", "error");
      throw new Error();
    }
  }

  // Reset filters
  function handleResetFilters() {
    setQuery("");
    setStatusFilter("all");
    setUserTypeFilter("all");
    setSortBy("recent");
  }

  // Loading boot screen
  if (!isReady) {
    return <AuthLoadingScreen message="Painel da Organização" />;
  }

  // Login gate
  if (!isAuthenticated) {
    return (
      <AdminLoginForm
        onLogin={handleLogin}
        error={loginError}
      />
    );
  }

  const activeCount = participants.filter((p) => !p.wonAt).length;
  const hasActiveFilters = Boolean(
    query ||
      statusFilter !== "all" ||
      userTypeFilter !== "all" ||
      sortBy !== "recent",
  );

  return (
    <main className="stitch-admin">
      <AdminSidebar
        view={view}
        onNavigate={handleNavigate}
        totalParticipants={participants.length}
        totalWinners={stats.winners}
        onLogout={logout}
      />

      <section className="stitch-content">
        {loading ? (
          <div className="stitch-content-loading" aria-live="polite">
            <div className="luxury-loader-track">
              <span className="luxury-loader-beam" />
            </div>
            <p>Carregando informações...</p>
          </div>
        ) : participantsError ? (
          <div className="stitch-empty" role="alert">
            <span className="material-symbols-outlined">cloud_off</span>
            <h2>Não foi possível carregar os participantes</h2>
            <p>{participantsError}</p>
          </div>
        ) : view === "participants" ? (
          <>
            <AdminHeader
              registrationsOpen={registrationsOpen}
              onToggleRegistrations={handleToggleRegistrations}
            />

            <AdminMetrics stats={stats} />

            <div className="stitch-panel-card">
              <AdminControls
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                userTypeFilter={userTypeFilter}
                onUserTypeChange={setUserTypeFilter}
                availableUserTypes={availableUserTypes}
                totalCount={participants.length}
                activeCount={activeCount}
                winnerCount={stats.winners}
                filteredCount={filteredParticipants.length}
                query={query}
                onQueryChange={setQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onExportCSV={exportToCSV}
                onResetFilters={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
              />

              <ParticipantsTable
                participants={filteredParticipants}
                totalParticipants={participants.length}
                onResetFilters={handleResetFilters}
                onEdit={(item) => setEditingParticipant(item)}
                onDelete={(item) => setDeletingParticipant(item)}
              />
            </div>
          </>
        ) : view === "draw-config" ? (
          <DrawConfigPanel
            adminKey={adminKey}
            totalParticipants={participants.length}
            activeParticipants={activeCount}
            totalWinners={stats.winners}
            registrationsOpen={registrationsOpen}
            onToggleRegistrations={handleToggleRegistrations}
            onShowToast={showToast}
          />
        ) : (
          <WinnersTable
            winners={winners}
            onNavigateToParticipants={() => handleNavigate("participants")}
          />
        )}

        {!loading && <Footer />}
      </section>

      {/* Edit Modal */}
      <EditParticipantModal
        participant={editingParticipant}
        isOpen={Boolean(editingParticipant)}
        onClose={() => setEditingParticipant(null)}
        onSave={handleSaveEdit}
      />

      {/* Delete Modal */}
      <DeleteParticipantModal
        participant={deletingParticipant}
        isOpen={Boolean(deletingParticipant)}
        onClose={() => setDeletingParticipant(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast Notification */}
      <Toast message={toast} onDismiss={dismissToast} />
    </main>
  );
}

export default function AdminPage() {
  return <AdminDashboard />;
}
