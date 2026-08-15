import { useSyncExternalStore, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants/storageKeys";

const AUTH_EVENT = "fashion_date_auth_change";

function subscribeAuth(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_EVENT, callback);
  };
}

function getAuthSnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      localStorage.getItem(STORAGE_KEYS.adminKey) ||
      sessionStorage.getItem(STORAGE_KEYS.adminKey) ||
      ""
    );
  } catch {
    return "";
  }
}

function getServerAuthSnapshot(): string {
  return "";
}

export function useAuth() {
  const adminKey = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  const isClient = useSyncExternalStore(
    subscribeAuth,
    () => true,
    () => false,
  );

  const login = useCallback((key: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.adminKey, key);
      sessionStorage.setItem(STORAGE_KEYS.adminKey, key);
      window.dispatchEvent(new Event(AUTH_EVENT));
    } catch {
      // storage quota or private mode
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.adminKey);
      sessionStorage.removeItem(STORAGE_KEYS.adminKey);
      window.dispatchEvent(new Event(AUTH_EVENT));
    } catch {
      // ignore
    }
  }, []);

  return {
    adminKey,
    isAuthenticated: Boolean(adminKey),
    isReady: isClient,
    login,
    logout,
  };
}
