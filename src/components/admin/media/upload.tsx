"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAdmin } from "../AdminProvider";
import { fileSize, type PickedMedia } from "../MediaPicker";
import { Button } from "../ui";

/* Multi-file upload with a progress bar per file (one request per file, two at a time). */

export type UploadItem = {
  key: string;
  name: string;
  size: number;
  progress: number; // 0..1
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const DOC_EXT = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];
export const ACCEPT = {
  image: "image/jpeg,image/png,image/webp,image/gif,image/avif",
  document: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
  any: "image/jpeg,image/png,image/webp,image/gif,image/avif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
};

/** Quick checks before sending (the server checks again, properly). */
function precheck(f: File, kind?: "image" | "document"): string | null {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  const isImage = IMAGE_TYPES.includes(f.type);
  const isDoc = DOC_EXT.includes(ext);
  if (kind === "image" && !isImage) return "Only images (JPG, PNG, WebP, GIF) can be added here.";
  if (kind === "document" && !isDoc) return "Only documents (PDF, Word, Excel, PowerPoint) can be added here.";
  if (!isImage && !isDoc) return "This file type is not allowed. Use JPG, PNG, WebP, GIF, PDF, Word, Excel or PowerPoint.";
  if (isImage && f.size > 15 * 1024 * 1024) return "Images must be 15 MB or smaller.";
  if (!isImage && f.size > 25 * 1024 * 1024) return "Documents must be 25 MB or smaller.";
  if (f.size === 0) return "This file is empty.";
  return null;
}

function send(file: File, csrf: string, onProgress: (p: number) => void): Promise<PickedMedia> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.setRequestHeader("x-csrf-token", csrf);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () => reject(new Error("Network error. Check your connection and try again."));
    xhr.onload = () => {
      let data: { error?: string; media?: PickedMedia[]; errors?: string[] } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON */
      }
      if (xhr.status === 401) {
        window.location.href = "/admin/login";
        return reject(new Error("Signed out"));
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.media?.[0]) return resolve(data.media[0]);
      reject(new Error(data.errors?.[0] ?? data.error ?? `Upload failed (${xhr.status}).`));
    };
    const fd = new FormData();
    fd.append("files", file);
    xhr.send(fd);
  });
}

let seq = 0;

/**
 * const { items, add, clear } = useUploader({ kind: "image", onDone: (media) => … })
 * add(files) uploads them; onDone gets the uploaded media in the order the files were given.
 */
export function useUploader({ kind, onDone }: { kind?: "image" | "document"; onDone?: (media: PickedMedia[]) => void | Promise<void> } = {}) {
  const { csrf } = useAdmin();
  const [items, setItems] = useState<UploadItem[]>([]);
  const busy = items.some((i) => i.status === "queued" || i.status === "uploading");
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  const patch = (key: string, p: Partial<UploadItem>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...p } : i)));

  const add = useCallback(
    async (files: File[] | FileList | null) => {
      const list = Array.from(files ?? []);
      if (!list.length) return;
      const entries = list.map((file) => ({ key: `u${++seq}`, file, error: precheck(file, kind) }));
      setItems((cur) => [
        ...cur.filter((i) => i.status === "queued" || i.status === "uploading"),
        ...entries.map((e) => ({
          key: e.key, name: e.file.name, size: e.file.size, progress: 0,
          status: e.error ? ("error" as const) : ("queued" as const), error: e.error ?? undefined,
        })),
      ]);
      const todo = entries.filter((e) => !e.error);
      const results: (PickedMedia | null)[] = todo.map(() => null);
      let next = 0;
      const worker = async () => {
        while (next < todo.length) {
          const n = next++;
          const e = todo[n];
          patch(e.key, { status: "uploading" });
          try {
            results[n] = await send(e.file, csrf, (p) => patch(e.key, { progress: p }));
            patch(e.key, { status: "done", progress: 1 });
          } catch (err) {
            patch(e.key, { status: "error", error: (err as Error).message });
          }
        }
      };
      await Promise.all([worker(), worker()]);
      const ok = results.filter((m): m is PickedMedia => Boolean(m));
      if (ok.length) await doneRef.current?.(ok);
      return ok;
    },
    [csrf, kind],
  );

  const clear = useCallback(() => setItems((list) => list.filter((i) => i.status === "queued" || i.status === "uploading")), []);
  return { items, add, clear, busy };
}

/** Drop files here, or click the button. */
export function DropZone({ onFiles, accept, multiple = true, label, hint, busy, children }: {
  onFiles: (files: File[]) => void; accept: string; multiple?: boolean; label: string; hint?: ReactNode; busy?: boolean; children?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      data-dropzone
      className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors sm:flex-row sm:text-left ${
        over ? "border-[#1a2d59] bg-[#eff4ff]" : "border-[#d0d5dd] bg-[#f9fafb]"
      }`}
    >
      <svg className="size-8 shrink-0 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex-1">
        <p className="text-[14px] font-medium text-[#101828]">{over ? "Drop to upload" : label}</p>
        {hint && <p className="text-[12px] text-[#667085]">{hint}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {children}
        <input
          ref={input}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          data-testid="upload-input"
          onChange={(e) => {
            onFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <Button type="button" tone="secondary" busy={busy} onClick={() => input.current?.click()}>
          {multiple ? "Upload files" : "Upload a file"}
        </Button>
      </div>
    </div>
  );
}

/** Progress / result of each file in the current upload batch. */
export function UploadList({ items, onClear }: { items: UploadItem[]; onClear: () => void }) {
  if (!items.length) return null;
  const finished = items.every((i) => i.status === "done" || i.status === "error");
  return (
    <div className="rounded-xl border border-[#eaecf0] bg-white" aria-live="polite">
      <div className="flex items-center justify-between border-b border-[#eaecf0] px-4 py-2.5">
        <p className="text-[13px] font-medium text-[#344054]">
          {finished
            ? `${items.filter((i) => i.status === "done").length} uploaded${items.some((i) => i.status === "error") ? `, ${items.filter((i) => i.status === "error").length} failed` : ""}`
            : `Uploading ${items.filter((i) => i.status !== "done" && i.status !== "error").length} of ${items.length}…`}
        </p>
        {finished && <Button type="button" tone="ghost" size="sm" onClick={onClear}>Dismiss</Button>}
      </div>
      <ul className="max-h-[240px] divide-y divide-[#f2f4f7] overflow-y-auto">
        {items.map((i) => (
          <li key={i.key} className="px-4 py-2.5" data-upload-status={i.status}>
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate text-[#101828]">{i.name}</span>
              <span className={`shrink-0 ${i.status === "error" ? "text-[#b42318]" : i.status === "done" ? "text-[#027a48]" : "text-[#667085]"}`}>
                {i.status === "done" ? "Done" : i.status === "error" ? "Failed" : i.status === "queued" ? "Waiting" : `${Math.round(i.progress * 100)}%`}
                <span className="ml-2 text-[#98a2b3]">{fileSize(i.size)}</span>
              </span>
            </div>
            {i.status === "error" ? (
              <p className="mt-1 text-[12px] text-[#b42318]">{i.error}</p>
            ) : (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f2f4f7]" role="progressbar" aria-label={`Upload progress of ${i.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(i.progress * 100)}>
                <div className={`h-full rounded-full transition-[width] ${i.status === "done" ? "bg-[#12b76a]" : "bg-[#1a2d59]"}`} style={{ width: `${Math.max(2, i.progress * 100)}%` }} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
