"use client";

import { useState, useRef, useEffect } from "react";
import type { SavedParticipant, UserType } from "@/types/participant.types";
import { USER_TYPE_LABELS, USER_TYPE_ICONS } from "@/types/participant.types";
import { PrivacyPolicyModal } from "@/components/public/PrivacyPolicyModal";
import { TermsOfUseModal } from "@/components/public/TermsOfUseModal";
import { SecurityPrivacyCard } from "@/components/public/SecurityPrivacyCard";
import { PwaProfileCard } from "@/components/pwa/PwaProfileCard";
import { PwaInstallModal } from "@/components/pwa/PwaInstallModal";
import { AvatarCropperModal } from "@/components/participant/AvatarCropperModal";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";
import { useSavedParticipant } from "@/hooks/useSavedParticipant";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatName, formatPhone, formatInstagram, formatDate } from "@/utils/formatters";

/**
 * Tenta fazer upload para o bucket 'avatars' no Supabase Storage.
 * Caso o bucket ou permissões não estejam disponíveis, usa o próprio data URL otimizado como fallback.
 */
async function uploadAvatarOrFallback(dataUrl: string, userId?: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (supabase && userId) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `${userId}/avatar-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!error && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(data.path);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch {
      // Fallback gracioso para data URL
    }
  }
  return dataUrl;
}

interface ProfileTabProps {
  participant: SavedParticipant | null;
  avatarUrl?: string | null;
  onLogout: () => void;
  onUpdateAvatar?: (url: string | null) => void;
}

export function ProfileTab({ participant, avatarUrl, onLogout, onUpdateAvatar }: ProfileTabProps) {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Photo management state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveParticipant } = useSavedParticipant();
  const { toast, showToast, dismissToast } = useToast();
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl || participant?.avatarUrl || null);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  useEffect(() => {
    setCurrentAvatarUrl(avatarUrl || participant?.avatarUrl || null);
  }, [avatarUrl, participant?.avatarUrl]);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Selecione um arquivo de imagem válido (JPG, PNG, WebP).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewDataUrl(reader.result);
        setIsModalPreviewOpen(true);
      }
    };
    reader.onerror = () => {
      showToast("Não foi possível carregar a imagem. Tente outra foto.", "error");
    };
    reader.readAsDataURL(file);
  }

  async function confirmSavePhoto(croppedDataUrl: string) {
    if (!croppedDataUrl) return;
    setIsSavingPhoto(true);

    try {
      const finalAvatarUrl = await uploadAvatarOrFallback(croppedDataUrl, participant?.authUserId);

      // 1. Atualiza metadados no Supabase Auth
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.auth.updateUser({
          data: { avatar_url: finalAvatarUrl },
        }).catch((err) => {
          console.warn("Supabase auth updateUser avatar warning:", err);
        });
      }

      // 2. Atualiza participante em cache local
      if (participant) {
        saveParticipant({
          ...participant,
          avatarUrl: finalAvatarUrl,
        });
      }

      // 3. Atualiza estado local e pai
      setCurrentAvatarUrl(finalAvatarUrl);
      setAvatarError(false);
      onUpdateAvatar?.(finalAvatarUrl);

      setIsModalPreviewOpen(false);
      setPreviewDataUrl(null);
      showToast("Foto de perfil atualizada com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao salvar foto de perfil:", err);
      showToast("Erro ao salvar a foto de perfil. Tente novamente.", "error");
    } finally {
      setIsSavingPhoto(false);
    }
  }

  async function handleRemovePhoto() {
    if (isSavingPhoto) return;
    setIsSavingPhoto(true);

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        await supabase.auth.updateUser({
          data: { avatar_url: "" },
        }).catch(() => {});
      }

      if (participant) {
        saveParticipant({
          ...participant,
          avatarUrl: null,
        });
      }

      setCurrentAvatarUrl(null);
      setAvatarError(false);
      onUpdateAvatar?.(null);

      showToast("Foto de perfil removida.", "info");
    } catch {
      showToast("Erro ao remover foto de perfil.", "error");
    } finally {
      setIsSavingPhoto(false);
    }
  }

  const {
    isStandalone,
    isIos,
    isAndroid,
    canPromptNative,
    isModalOpen: isPwaModalOpen,
    promptInstall,
    openGuide,
    closeGuide,
  } = usePwaInstall();

  async function handleDeleteAccount() {
    if (!participant) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/participants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: participant.id,
          phone: participant.phone,
          authUserId: participant.authUserId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao excluir conta");
      }

      // Desloga o usuário e limpa o armazenamento local completamente
      onLogout();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao excluir conta";
      setDeleteError(message);
      setIsDeleting(false);
    }
  }

  const resolvedAvatar = !avatarError ? (currentAvatarUrl || null) : null;

  const displayName = participant?.name ? formatName(participant.name) : "Participante";
  const formattedPhone = participant?.phone ? formatPhone(participant.phone) : "Não informado";
  const formattedInstagram = participant?.instagram && participant.instagram !== "—"
    ? formatInstagram(participant.instagram)
    : "Não informado";
  const userType = (participant?.userType?.toLowerCase() || "lojista") as UserType;
  const userTypeLabel = USER_TYPE_LABELS[userType] || USER_TYPE_LABELS.lojista;
  const userTypeIcon = USER_TYPE_ICONS[userType] || "storefront";
  const storeName = participant?.store && participant.store !== "—" ? participant.store : "Participante Individual";
  const registrationDate = participant?.createdAt ? formatDate(participant.createdAt) : "Registrado";

  return (
    <>
      {/* Header Padronizado do Painel */}
      <header className="stitch-header">
        <div>
          <h1>Meus Dados</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
            <span className="stitch-status open">
              <i /> Conta Ativa
            </span>
          </div>
        </div>
      </header>

      {/* Haute Couture Identity Card */}
      <div
        className="stitch-panel-card"
        style={{
          padding: "24px 28px",
          marginBottom: "24px",
          background: "linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%)",
          border: "1.5px solid #ebdcc5",
          boxShadow: "0 4px 20px rgba(67, 0, 20, 0.03)",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Avatar com Badge Interativo */}
        <div className="stitch-avatar-profile-wrapper">
          <div className="stitch-avatar stitch-avatar-profile">
            {resolvedAvatar ? (
              <img
                src={resolvedAvatar}
                alt={displayName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
              />
            ) : (
              displayName.charAt(0)
            )}
          </div>

          <button
            type="button"
            className="stitch-avatar-camera-badge"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Alterar foto de perfil"
            title="Alterar foto"
          >
            <span className="material-symbols-outlined">photo_camera</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/heic, image/gif"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />

        <div style={{ flex: 1, minWidth: "240px" }}>
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: "24px",
              fontFamily: "var(--font-fashion, serif)",
              color: "#332225",
              fontWeight: 600,
            }}
          >
            {displayName}
          </h2>

          <p style={{ margin: 0, fontSize: "13px", color: "#786568", display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#9a741a" }}>
              {userTypeIcon}
            </span>
            <span style={{ fontWeight: 600, color: "#530017" }}>{userTypeLabel}</span>
          </p>
        </div>
      </div>

      {/* Grid de Informações Estruturadas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        {/* Painel 1: Dados Cadastrais */}
        <div className="stitch-panel-card">
          <div className="stitch-controls-header">
            <div className="stitch-header-info">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#9a741a" }}>
                  badge
                </span>
                <strong style={{ fontSize: "13.5px", color: "#332225", fontWeight: 700 }}>
                  Informações de Cadastro
                </strong>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px", display: "grid", gap: "12px" }}>
            {/* WhatsApp */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: "1px solid #ebdcc5",
                borderRadius: "10px",
                background: "#fdfaf6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="#25D366"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.477-.15-.678.15-.201.3-.777.978-.953 1.179-.175.2-.351.225-.652.075-.301-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.675-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.3.301-.501.101-.2.051-.376-.025-.526-.075-.15-.677-1.63-1.002-2.306-.296-.707-.597-.61-.678-.614h-.577c-.201 0-.527.075-.802.376s-1.053 1.028-1.053 2.508c0 1.48 1.079 2.909 1.229 3.109.15.201 2.122 3.24 5.141 4.541.718.309 1.279.494 1.716.633.722.23 1.38.197 1.9.12.579-.086 1.78-.727 2.031-1.429.251-.702.251-1.304.176-1.43-.076-.125-.276-.201-.577-.351zM12.004 21.996a9.94 9.94 0 0 1-5.074-1.39l-.364-.216-3.77.989.99-3.676-.237-.377A9.947 9.947 0 0 1 2.057 12C2.057 6.518 6.517 2.058 12.004 2.058c2.658 0 5.158 1.035 7.037 2.915a9.9 9.9 0 0 1 2.913 7.027c0 5.485-4.46 9.996-9.95 9.996zM12 0C5.373 0 0 5.373 0 12c0 2.115.551 4.103 1.517 5.834L0 24l6.335-1.49c1.676.914 3.59 1.49 5.665 1.49 6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                </svg>
                <span style={{ fontSize: "12.5px", color: "#786568", fontWeight: 600 }}>WhatsApp</span>
              </div>
              <strong style={{ fontSize: "13px", color: "#332225", fontFamily: "var(--font-mono, monospace)" }}>
                {formattedPhone}
              </strong>
            </div>

            {/* E-mail */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: "1px solid #ebdcc5",
                borderRadius: "10px",
                background: "#fdfaf6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#9a741a" }}>
                  mail
                </span>
                <span style={{ fontSize: "12.5px", color: "#786568", fontWeight: 600 }}>E-mail</span>
              </div>
              <strong style={{ fontSize: "13px", color: "#332225" }}>
                {participant?.email || "—"}
              </strong>
            </div>

            {/* Instagram */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: "1px solid #ebdcc5",
                borderRadius: "10px",
                background: "#fdfaf6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ flexShrink: 0 }}
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="ig-gradient-profile" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f09433" />
                      <stop offset="30%" stopColor="#e6683c" />
                      <stop offset="60%" stopColor="#dc2743" />
                      <stop offset="85%" stopColor="#cc2366" />
                      <stop offset="100%" stopColor="#bc1888" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                    fill="url(#ig-gradient-profile)"
                  />
                </svg>
                <span style={{ fontSize: "12.5px", color: "#786568", fontWeight: 600 }}>Instagram</span>
              </div>
              <strong style={{ fontSize: "13px", color: "#332225" }}>
                {formattedInstagram}
              </strong>
            </div>

            {/* Loja / Empresa */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: "1px solid #ebdcc5",
                borderRadius: "10px",
                background: "#fdfaf6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#530017" }}>
                  {userType === "revendedor" ? "local_mall" : "storefront"}
                </span>
                <span style={{ fontSize: "12.5px", color: "#786568", fontWeight: 600 }}>Loja / Marca</span>
              </div>
              <strong style={{ fontSize: "13px", color: "#332225" }}>
                {storeName}
              </strong>
            </div>

            {/* Cidade */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: "1px solid #ebdcc5",
                borderRadius: "10px",
                background: "#fdfaf6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#9a741a" }}>
                  location_on
                </span>
                <span style={{ fontSize: "12.5px", color: "#786568", fontWeight: 600 }}>Cidade</span>
              </div>
              <strong style={{ fontSize: "13px", color: "#332225" }}>
                {participant?.city || "Não informada"}
              </strong>
            </div>

            {/* Data de Cadastro */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: "1px solid #ebdcc5",
                borderRadius: "10px",
                background: "#fdfaf6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#8c787a" }}>
                  calendar_today
                </span>
                <span style={{ fontSize: "12.5px", color: "#786568", fontWeight: 600 }}>Data do Cadastro</span>
              </div>
              <strong style={{ fontSize: "13px", color: "#332225" }}>
                {registrationDate}
              </strong>
            </div>
          </div>
        </div>

        {/* Painel 2: Termos, Privacidade & Segurança */}
        <SecurityPrivacyCard
          onOpenTerms={() => setIsTermsOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onDeleteAccount={() => setIsDeleteModalOpen(true)}
        />

        {/* Painel 3: Aplicativo & Atalho (PWA) */}
        <PwaProfileCard
          isStandalone={isStandalone}
          isIos={isIos}
          isAndroid={isAndroid}
          canPromptNative={canPromptNative}
          onPromptNative={promptInstall}
          onOpenGuide={openGuide}
        />
      </div>

      {/* Modais Oficiais */}
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsOfUseModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={closeGuide}
        defaultPlatform={isIos ? "ios" : "android"}
        canPromptNative={canPromptNative}
        onPromptNative={promptInstall}
      />

      {/* Modal de Confirmação para Exclusão de Conta (LGPD) */}
      {isDeleteModalOpen && (
        <div
          className="admin-modal-backdrop gate-modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 99999,
          }}
          onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
        >
          <div
            className="stitch-panel-card"
            style={{
              maxWidth: "440px",
              width: "100%",
              padding: "28px 24px",
              borderRadius: "16px",
              textAlign: "center",
              background: "#ffffff",
              border: "1px solid #ebdcc5",
              boxShadow: "0 20px 50px rgba(67, 0, 20, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                warning
              </span>
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "20px",
                fontFamily: "var(--font-fashion, serif)",
                color: "#530017",
                fontWeight: 700,
              }}
            >
              Excluir minha conta?
            </h3>

            <p style={{ margin: "0 0 20px", fontSize: "13.5px", color: "#6d5b5d", lineHeight: "1.5" }}>
              Ao confirmar, seu cadastro e todos os seus números da sorte serão removidos definitivamente.
            </p>

            {deleteError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  border: "1px solid #fca5a5",
                  color: "#991b1b",
                  fontSize: "12px",
                  marginBottom: "16px",
                }}
              >
                {deleteError}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                className="stitch-button outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                style={{
                  minHeight: "44px",
                  borderColor: "#ebdcc5",
                  color: "#5a474a",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="stitch-button filled"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                style={{
                  minHeight: "44px",
                  background: "#991b1b",
                  borderColor: "#991b1b",
                  color: "#ffffff",
                }}
              >
                {isDeleting ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Interativo de Recorte, Zoom e Enquadramento da Foto */}
      <AvatarCropperModal
        isOpen={isModalPreviewOpen}
        imageSrc={previewDataUrl}
        onClose={() => {
          if (!isSavingPhoto) {
            setIsModalPreviewOpen(false);
            setPreviewDataUrl(null);
          }
        }}
        onSave={confirmSavePhoto}
        onRemoveCurrentPhoto={
          resolvedAvatar
            ? async () => {
                await handleRemovePhoto();
                setIsModalPreviewOpen(false);
                setPreviewDataUrl(null);
              }
            : undefined
        }
        hasCurrentPhoto={Boolean(resolvedAvatar)}
        isSaving={isSavingPhoto}
      />

      <Toast message={toast} onDismiss={dismissToast} />
    </>
  );
}
