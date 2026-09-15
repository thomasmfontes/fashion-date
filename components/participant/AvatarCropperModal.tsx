"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => Promise<void>;
  onRemoveCurrentPhoto?: () => Promise<void>;
  hasCurrentPhoto: boolean;
  isSaving: boolean;
}

const VIEWPORT_SIZE = 260; // tamanho do canvas no modal
const CROP_RADIUS = 105;   // raio do círculo (diâmetro 210px)
const EXPORT_SIZE = 320;   // resolução final do avatar salvo

export function AvatarCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  onRemoveCurrentPhoto,
  hasCurrentPhoto,
  isSaving,
}: AvatarCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Estados de transformação
  const [zoom, setZoom] = useState(1); // 1x a 3.5x
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);

  // Estados de arrasto (drag)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef<number | null>(null);

  // 1. Carrega a imagem original em elemento HTMLImageElement
  useEffect(() => {
    if (!imageSrc || !isOpen) {
      setImgElement(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Calcula escala base para que a imagem cubra o círculo
  const getBaseScale = useCallback((img: HTMLImageElement, rot: number) => {
    const isSideways = rot === 90 || rot === 270;
    const w = isSideways ? img.height : img.width;
    const h = isSideways ? img.width : img.height;
    const diameter = CROP_RADIUS * 2;
    return Math.max(diameter / w, diameter / h);
  }, []);

  // Clampa o deslocamento para que o círculo nunca fique com buracos vazios
  const clampPan = useCallback(
    (x: number, y: number, currentScale: number, img: HTMLImageElement, rot: number) => {
      const isSideways = rot === 90 || rot === 270;
      const w = (isSideways ? img.height : img.width) * currentScale;
      const h = (isSideways ? img.width : img.height) * currentScale;

      const maxPanX = Math.max(0, (w - CROP_RADIUS * 2) / 2);
      const maxPanY = Math.max(0, (h - CROP_RADIUS * 2) / 2);

      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, y)),
      };
    },
    [],
  );

  // 2. Renderiza no Canvas interativo
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseScale = getBaseScale(imgElement, rotation);
    const currentScale = baseScale * zoom;
    const clampedPan = clampPan(pan.x, pan.y, currentScale, imgElement, rotation);

    const center = VIEWPORT_SIZE / 2;

    // Limpa
    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    // 2.1 Desenha a imagem transformada
    ctx.save();
    ctx.translate(center + clampedPan.x, center + clampedPan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(currentScale, currentScale);
    ctx.drawImage(imgElement, -imgElement.width / 2, -imgElement.height / 2);
    ctx.restore();

    // 2.2 Máscara escura fora do círculo (vignette/guide)
    ctx.save();
    ctx.fillStyle = "rgba(30, 8, 14, 0.62)";
    ctx.beginPath();
    ctx.rect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
    ctx.arc(center, center, CROP_RADIUS, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // 2.3 Guia suave de grade/enquadramento (linhas de terços muito sutis)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, CROP_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // terços horizontais
    ctx.moveTo(center - CROP_RADIUS, center - CROP_RADIUS * 0.33);
    ctx.lineTo(center + CROP_RADIUS, center - CROP_RADIUS * 0.33);
    ctx.moveTo(center - CROP_RADIUS, center + CROP_RADIUS * 0.33);
    ctx.lineTo(center + CROP_RADIUS, center + CROP_RADIUS * 0.33);
    // terços verticais
    ctx.moveTo(center - CROP_RADIUS * 0.33, center - CROP_RADIUS);
    ctx.lineTo(center - CROP_RADIUS * 0.33, center + CROP_RADIUS);
    ctx.moveTo(center + CROP_RADIUS * 0.33, center - CROP_RADIUS);
    ctx.lineTo(center + CROP_RADIUS * 0.33, center + CROP_RADIUS);
    ctx.stroke();
    ctx.restore();

    // 2.4 Borda dourada nobre (Haute Couture)
    ctx.save();
    ctx.strokeStyle = "#c79a36";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(83, 0, 23, 0.35)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(center, center, CROP_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [imgElement, zoom, pan, rotation, getBaseScale, clampPan]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // 3. Handlers de Arrastar (Mouse e Touch)
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDraggingRef.current || !imgElement) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const baseScale = getBaseScale(imgElement, rotation);
    const currentScale = baseScale * zoom;
    const nextPan = clampPan(
      panStartRef.current.x + dx,
      panStartRef.current.y + dy,
      currentScale,
      imgElement,
      rotation,
    );
    setPan(nextPan);
  }

  function handleMouseUp() {
    isDraggingRef.current = false;
  }

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
      pinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistRef.current = Math.hypot(dx, dy);
    }
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    if (!imgElement) return;

    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;

      const baseScale = getBaseScale(imgElement, rotation);
      const currentScale = baseScale * zoom;
      const nextPan = clampPan(
        panStartRef.current.x + dx,
        panStartRef.current.y + dy,
        currentScale,
        imgElement,
        rotation,
      );
      setPan(nextPan);
    } else if (e.touches.length === 2 && pinchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const ratio = newDist / pinchDistRef.current;
      pinchDistRef.current = newDist;

      setZoom((prev) => Math.max(1, Math.min(3.5, prev * ratio)));
    }
  }

  function handleTouchEnd() {
    isDraggingRef.current = false;
    pinchDistRef.current = null;
  }

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.max(1, Math.min(3.5, prev + delta)));
  }

  // Girar 90 graus
  function handleRotate() {
    setRotation((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
    setPan({ x: 0, y: 0 });
  }

  // Centralizar
  function handleReset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  // 4. Exportação final em 320x320 com qualidade 0.90
  async function handleConfirmCrop() {
    if (!imgElement) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = EXPORT_SIZE;
    exportCanvas.height = EXPORT_SIZE;
    const expCtx = exportCanvas.getContext("2d");
    if (!expCtx) return;

    const baseScale = getBaseScale(imgElement, rotation);
    const currentScale = baseScale * zoom;
    const clampedPan = clampPan(pan.x, pan.y, currentScale, imgElement, rotation);

    const exportScale = EXPORT_SIZE / (CROP_RADIUS * 2);

    expCtx.save();
    expCtx.translate(EXPORT_SIZE / 2, EXPORT_SIZE / 2);
    // Translação na escala do export
    expCtx.translate(clampedPan.x * exportScale, clampedPan.y * exportScale);
    expCtx.rotate((rotation * Math.PI) / 180);
    expCtx.scale(currentScale * exportScale, currentScale * exportScale);
    expCtx.drawImage(imgElement, -imgElement.width / 2, -imgElement.height / 2);
    expCtx.restore();

    const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.90);
    await onSave(dataUrl);
  }

  if (!isOpen) return null;

  return (
    <div
      className="edit-modal-backdrop cropper-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        className="edit-modal cropper-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cropper-modal-title"
      >
        {/* Cabeçalho Haute Couture */}
        <header className="cropper-modal-header">
          <div>
            <span className="cropper-modal-kicker">Alta-Costura · Ajustar Foto</span>
            <h2 id="cropper-modal-title" className="cropper-modal-title">
              Enquadrar Foto de Perfil
            </h2>
          </div>
          <button
            type="button"
            className="edit-modal-close"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="cropper-modal-content">
          {/* Viewport Interativo do Canvas */}
          <div className="cropper-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={VIEWPORT_SIZE}
              height={VIEWPORT_SIZE}
              className="cropper-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              style={{ touchAction: "none" }}
            />
            <div className="cropper-drag-hint">
              <span className="material-symbols-outlined">pan_tool</span>
              Arraste para posicionar
            </div>
          </div>

          {/* Barra de Controles de Zoom e Rotação */}
          <div className="cropper-controls-bar">
            <div className="cropper-zoom-controls">
              <button
                type="button"
                className="cropper-tool-btn"
                onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
                title="Diminuir zoom"
                disabled={zoom <= 1 || isSaving}
              >
                <span className="material-symbols-outlined">zoom_out</span>
              </button>

              <input
                type="range"
                min="1"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="cropper-zoom-slider"
                disabled={isSaving}
                aria-label="Controle de zoom"
              />

              <button
                type="button"
                className="cropper-tool-btn"
                onClick={() => setZoom((prev) => Math.min(3.5, prev + 0.2))}
                title="Aumentar zoom"
                disabled={zoom >= 3.5 || isSaving}
              >
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
            </div>

            <div className="cropper-aux-tools">
              <button
                type="button"
                className="cropper-tool-pill"
                onClick={handleRotate}
                disabled={isSaving}
                title="Girar foto em 90 graus"
              >
                <span className="material-symbols-outlined">rotate_right</span>
                Girar
              </button>

              <button
                type="button"
                className="cropper-tool-pill"
                onClick={handleReset}
                disabled={isSaving || (zoom === 1 && pan.x === 0 && pan.y === 0)}
                title="Restaurar tamanho padrão"
              >
                <span className="material-symbols-outlined">restart_alt</span>
                Centralizar
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé Otimizado e Elegante */}
        <footer className="cropper-modal-footer">
          <div className="cropper-primary-actions">
            <button
              type="button"
              className="stitch-button outline cropper-cancel-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="stitch-button filled cropper-save-btn"
              onClick={handleConfirmCrop}
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar Foto"}
            </button>
          </div>

          {hasCurrentPhoto && onRemoveCurrentPhoto && (
            <button
              type="button"
              className="cropper-remove-link"
              onClick={onRemoveCurrentPhoto}
              disabled={isSaving}
            >
              <span className="material-symbols-outlined">delete</span>
              Remover foto atual
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
