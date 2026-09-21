import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";

export type WinnerAnnouncedPayload = {
  drawId?: string;
  winnerNumber?: string;
  drawTitle?: string;
  prizeTitle?: string;
  timestamp?: string;
};

type BroadcastHandler<T = unknown> = (payload: T) => void;

class RealtimeLiveDrawManager {
  private channel: RealtimeChannel | null = null;
  private listeners: Map<string, Set<BroadcastHandler<any>>> = new Map();
  private disconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;
  private isListeningVisibility = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initVisibilityListener();
    }
  }

  private initVisibilityListener() {
    if (this.isListeningVisibility || typeof document === "undefined") return;
    this.isListeningVisibility = true;

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        // Se o usuário minimizou ou desligou a tela, desconecta após 25 segundos
        // Isso economiza slots de conexão simultânea no Supabase (limite de 200 do plano Free)
        if (this.disconnectTimeout) clearTimeout(this.disconnectTimeout);
        this.disconnectTimeout = setTimeout(() => {
          this.disconnect();
        }, 25000);
      } else if (document.visibilityState === "visible") {
        // Ao retornar para o app, cancela o timer de desconexão e reconecta instantaneamente
        if (this.disconnectTimeout) {
          clearTimeout(this.disconnectTimeout);
          this.disconnectTimeout = null;
        }
        if (this.hasActiveListeners() && !this.isConnected) {
          this.connect();
        }
      }
    });
  }

  private hasActiveListeners(): boolean {
    for (const [, set] of this.listeners) {
      if (set.size > 0) return true;
    }
    return false;
  }

  public connect(): RealtimeChannel | null {
    if (typeof window === "undefined") return null;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;

    if (this.channel && this.isConnected) {
      return this.channel;
    }

    // Se já existia um canal em transição, limpa antes
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch {
        // no-op
      }
      this.channel = null;
    }

    const channel = supabase.channel("live-draw", {
      config: {
        broadcast: { ack: false },
      },
    });

    channel
      .on("broadcast", { event: "winner-announced" }, (eventMsg: any) => {
        const payload = (eventMsg?.payload || eventMsg || {}) as WinnerAnnouncedPayload;
        this.emit("winner-announced", payload);
      })
      .on("broadcast", { event: "participant-updated" }, (eventMsg: any) => {
        const payload = eventMsg?.payload || eventMsg || {};
        this.emit("participant-updated", payload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.isConnected = true;
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          this.isConnected = false;
        }
      });

    this.channel = channel;
    return channel;
  }

  public disconnect(): void {
    if (!this.channel) return;

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        supabase.removeChannel(this.channel);
      } catch {
        // no-op
      }
    }
    this.channel = null;
    this.isConnected = false;
  }

  private emit(event: string, payload: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[RealtimeLiveDrawManager] Erro no listener do evento ${event}:`, err);
      }
    });
  }

  /**
   * Registra um ouvinte para um evento de broadcast no canal live-draw.
   * Retorna a função de limpeza para cancelar a inscrição.
   */
  public subscribe<T = unknown>(event: string, handler: BroadcastHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as BroadcastHandler<any>);

    // Garante que o canal está conectado se a página estiver visível
    if (typeof document === "undefined" || document.visibilityState === "visible") {
      this.connect();
    }

    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(handler as BroadcastHandler<any>);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }

      // Se nenhum ouvinte estiver mais ativo, desconecta após um breve delay
      if (!this.hasActiveListeners()) {
        setTimeout(() => {
          if (!this.hasActiveListeners()) {
            this.disconnect();
          }
        }, 5000);
      }
    };
  }

  /**
   * Permite disparar mensagens no canal central caso necessário.
   */
  public async broadcast(event: string, payload: Record<string, unknown>): Promise<boolean> {
    const ch = this.connect();
    if (!ch) return false;

    try {
      await ch.send({
        type: "broadcast",
        event,
        payload,
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton exportado
export const realtimeLiveDraw = new RealtimeLiveDrawManager();
