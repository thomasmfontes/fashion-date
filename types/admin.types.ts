export type AdminView = "participants" | "winners";

export interface AdminSession {
  key: string;
  isAuthenticated: boolean;
}

export interface ToastMessage {
  id?: string;
  text: string;
  type?: "success" | "error" | "info";
}
