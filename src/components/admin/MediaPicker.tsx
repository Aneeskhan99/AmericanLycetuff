"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { Button, Dialog, Empty, Input, SearchBox } from "./ui";

/** What a picker returns (same shape as MediaRef in src/lib/media.ts). */
export type PickedMedia = {
  id: number; url: string; alt: string; width: number | null; height: number | null;
  srcSet: string; mime: string; kind: "image" | "document"; name: string; size: number;
};

type Row = { id: number; original_name: string; alt: string; kind: "image" | "document"; size: number; created_at: string; ref: PickedMedia; variants: Record<string, { path: string }> };

export function thumbUrl(m: Pick<PickedMedia, "url" | "srcSet">) {
  // smallest srcset candidate, else the file itself
  return m.srcSet ? m.srcSet.split(",")[0].trim().split(" ")[0] : m.url;
}

export const fileSize = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/**
 * Choose from the media library or upload new files.
 *   kind:     restricts to images or documents
 *   multiple: allow choosing several (gallery albums)
 */
export default function MediaPicker({ open, onClose, onPick, kind, multiple = false, title }: {
  open: boolean; onClose: () => void; onPick: (items: PickedMedia[]) => void;
  kind?: "image" | "document"; multiple?: boolean; title?: string;
}) {
  const { api, toast, upload: uploadForm } = useAdmin();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState<PickedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ search, page: String(p), pageSize: "30", ...(kind ? { kind } : {}) });
      const d = await api<{ rows: Row[]; total: number }>(`/api/admin/media?${qs}`);
      setRows((r) => (append ? [...r, ...d.rows] : d.rows));
      setTotal(d.total);
      setPage(p);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [api, toast, search, kind]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void load(1, false), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, load, search]);

  const toggle = (m: PickedMedia) => {
    setChosen((c) => (c.some((x) => x.id === m.id) ? c.filter((x) => x.id !== m.id) : multiple ? [...c, m] : [m]));
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      const data = await uploadForm<{ media?: PickedMedia[]; errors?: string[] }>("/api/admin/media", fd);
      if (data.errors?.length) toast(data.errors.join(" "), "error");
      const got = (data.media ?? []).filter((m) => !kind || m.kind === kind);
      setChosen((c) => (multiple ? [...c, ...got] : got.slice(-1)));
      toast(`${got.length} file${got.length === 1 ? "" : "s"} uploaded`);
      void load(1, false);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const close = () => {
    setChosen([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      wide
      title={title ?? (kind === "document" ? "Choose a document" : multiple ? "Choose images" : "Choose an image")}
      footer={
        <>
          <span className="mr-auto self-center text-[13px] text-[#667085]">{chosen.length ? `${chosen.length} selected` : ""}</span>
          <Button tone="secondary" onClick={close}>Cancel</Button>
          <Button disabled={!chosen.length} onClick={() => { onPick(chosen); setChosen([]); }}>
            {multiple ? `Add ${chosen.length || ""}`.trim() : "Use this"}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBox value={search} onChange={setSearch} placeholder="Search files" />
        <input
          ref={fileInput}
          type="file"
          multiple={multiple}
          className="hidden"
          accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : kind === "document" ? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" : "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"}
          onChange={(e) => upload(e.target.files)}
        />
        <Button tone="secondary" busy={uploading} onClick={() => fileInput.current?.click()} className="sm:ml-auto">
          Upload {multiple ? "files" : "a file"}
        </Button>
      </div>
      {rows.length === 0 && !loading ? (
        <Empty title="Nothing here yet">Upload {kind === "document" ? "a document" : "an image"} to get started.</Empty>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {rows.map((r) => {
            const on = chosen.some((c) => c.id === r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => toggle(r.ref)}
                  aria-pressed={on}
                  className={`group block w-full overflow-hidden rounded-lg border-2 text-left ${on ? "border-[#1a2d59] ring-2 ring-[#1a2d59]/20" : "border-transparent hover:border-[#d0d5dd]"}`}
                >
                  <span className="flex aspect-square items-center justify-center bg-[#f2f4f7]">
                    {r.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbUrl(r.ref)} alt={r.alt} className="size-full object-cover" loading="lazy" />
                    ) : (
                      <span className="rounded bg-white px-2 py-1 text-[12px] font-semibold uppercase text-[#b42318]">{r.original_name.split(".").pop()}</span>
                    )}
                  </span>
                  <span className="block truncate px-1.5 py-1 text-[11px] text-[#475467]">{r.original_name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length < total && (
        <div className="mt-4 text-center">
          <Button tone="secondary" busy={loading} onClick={() => load(page + 1, true)}>Load more</Button>
        </div>
      )}
    </Dialog>
  );
}

/**
 * A form field for one image: preview, choose/replace, remove, and alt text.
 * value is null or { id, url, alt }.
 */
export function ImageInput({ value, onChange, label = "Image", allowRemove = true, contain = false }: {
  value: { id: number; url: string; alt: string } | null;
  onChange: (v: { id: number; url: string; alt: string } | null) => void;
  label?: string;
  allowRemove?: boolean;
  /** Show the whole image (logos) instead of a square crop. */
  contain?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-[#344054]">{label}</span>
      <div className="flex items-start gap-3">
        <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#eaecf0] bg-[#f9fafb] ${contain ? "h-24 w-40" : "size-24"}`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt={value.alt} className={contain ? "size-full object-contain p-1.5" : "size-full object-cover"} />
          ) : (
            <span className="text-[12px] text-[#98a2b3]">No image</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" tone="secondary" size="sm" onClick={() => setOpen(true)}>{value ? "Replace" : "Choose image"}</Button>
            {value && allowRemove && <Button type="button" tone="ghost" size="sm" onClick={() => onChange(null)}>Remove</Button>}
          </div>
          {value && (
            <Input
              value={value.alt}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              placeholder="Describe the image (alt text)"
              aria-label="Alt text"
            />
          )}
        </div>
      </div>
      <MediaPicker
        open={open}
        kind="image"
        onClose={() => setOpen(false)}
        onPick={([m]) => {
          setOpen(false);
          if (m) onChange({ id: m.id, url: m.url, alt: m.alt || value?.alt || "" });
        }}
      />
    </div>
  );
}
