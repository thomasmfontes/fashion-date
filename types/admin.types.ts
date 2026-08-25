export type AdminView = "participants" | "draw-config" | "winners";

export type DrawMode = "provador" | "numeric";

export interface AdminSession {
  key: string;
  isAuthenticated: boolean;
}

export interface ToastMessage {
  id?: string;
  text: string;
  type?: "success" | "error" | "info";
}
