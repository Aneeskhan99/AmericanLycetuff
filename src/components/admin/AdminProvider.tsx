"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

export type Role = "administrator" | "editor" | "author";
export type AdminUser = { id: number; username: string; email: string; name: string; role: Role; must_change_password: boolean };

type Toast = { id: number; text: string; tone: "ok" | "error" };
type Ctx = {
  user: AdminUser;
  api: <T = unknown>(path: string, init?: { method?: string; body?: unknown }) => Promise<T>;
  toast: (text: string, tone?: Toast["tone"]) => void;
  /** POSTs multipart form data (file uploads) with the CSRF header. */
  upload: <T = unknown>(path: string, form: FormData) => Promise<T>;
  csrf: string;
};

const AdminCtx = createContext<Ctx | null>(null);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Session user, a CSRF-aware fetch helper and toasts for every admin screen. */
export function AdminProvider({ user, csrf, children }: { user: AdminUser; csrf: string; children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const toast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 6000 : 3500);
  }, []);

  const api = useCallback(
    async <T,>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> => {
      const method = init.method ?? (init.body === undefined ? "GET" : "POST");
      const res = await fetch(path, {
        method,
        credentials: "same-origin",
        headers: {
          ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(method !== "GET" ? { "x-csrf-token": csrf } : {}),
        },
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; mustChangePassword?: boolean };
      if (res.status === 401) {
        window.location.href = "/admin/login";
        throw new ApiError(401, data.error ?? "Signed out");
      }
      if (data.mustChangePassword) {
        window.location.href = "/admin/account";
        throw new ApiError(403, data.error ?? "Please set a new password");
      }
      if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
      return data as T;
    },
    [csrf],
  );

  const upload = useCallback(
    async <T,>(path: string, form: FormData): Promise<T> => {
      const res = await fetch(path, { method: "POST", body: form, headers: { "x-csrf-token": csrf }, credentials: "same-origin" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) window.location.href = "/admin/login";
      if (!res.ok) throw new ApiError(res.status, data.error ?? `Upload failed (${res.status})`);
      return data as T;
    },
    [csrf],
  );

  const value = useMemo(() => ({ user, api, toast, upload, csrf }), [user, api, toast, upload, csrf]);

  return (
    <AdminCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-[360px] rounded-lg px-4 py-3 text-[14px] text-white shadow-lg ${
              t.tone === "error" ? "bg-[#b42318]" : "bg-[#1a2d59]"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </AdminCtx.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}

export const ROLE_LABEL: Record<Role, string> = {
  administrator: "Administrator",
  editor: "Editor",
  author: "Author",
};
