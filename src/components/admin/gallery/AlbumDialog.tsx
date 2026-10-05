"use client";

import { useState, type FormEvent } from "react";
import { filters } from "@/components/gallery/photos";
import { useAdmin } from "../AdminProvider";
import { Button, Checkbox, Dialog, ErrorNote, Field, Input, Select, slugify, Textarea } from "../ui";

export type AlbumMedia = { id: number; url: string; alt: string; srcSet: string; width: number | null; height: number | null; name: string };
export type Album = {
  id: number; title: string; slug: string; description: string; category: string; event_date: string | null;
  cover_media_id: number | null; sort: number; published: boolean; updated_at: string; count: number; cover: AlbumMedia | null;
};

/** The gallery's filter tabs (an album's photos also appear in its tab). */
export const CATEGORIES = filters.filter((f) => f.id !== "all");
export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? "";

/** Create or edit an album's details. */
export default function AlbumDialog({ album, onClose, onDone }: { album: Album | null; onClose: () => void; onDone: (id: number) => void }) {
  const { api, toast } = useAdmin();
  const [f, setF] = useState(() => ({
    title: album?.title ?? "",
    slug: album?.slug ?? "",
    description: album?.description ?? "",
    category: album?.category ?? "",
    eventDate: album?.event_date ?? "",
    published: album?.published ?? true,
  }));
  const [slugEdited, setSlugEdited] = useState(Boolean(album));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!f.title.trim()) return setError("Title is required.");
    setBusy(true);
    try {
      const payload = { ...f, slug: f.slug || slugify(f.title), slugAuto: !slugEdited, coverMediaId: album?.cover_media_id ?? null };
      if (album) {
        await api(`/api/admin/albums/${album.id}`, { method: "PATCH", body: payload });
        toast("Album saved");
        onDone(album.id);
      } else {
        const d = await api<{ id: number }>("/api/admin/albums", { body: payload });
        toast("Album created. Now add photos.");
        onDone(d.id);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      title={album ? "Album details" : "New album"}
      onClose={onClose}
      wide
      footer={
        <>
          <Button tone="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="album-form" busy={busy}>{album ? "Save changes" : "Create album"}</Button>
        </>
      }
    >
      <form id="album-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Title" htmlFor="al-title" required>
          <Input
            id="al-title"
            value={f.title}
            maxLength={140}
            autoFocus={!album}
            onChange={(e) => setF({ ...f, title: e.target.value, slug: slugEdited ? f.slug : slugify(e.target.value) })}
          />
        </Field>
        <Field label="Web address" htmlFor="al-slug" hint={<>The album will be at <span className="font-mono">/gallery/{f.slug || "…"}</span>. Must be unique.</>}>
          <Input
            id="al-slug"
            value={f.slug}
            maxLength={80}
            className="font-mono"
            spellCheck={false}
            onChange={(e) => { setSlugEdited(true); setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-") }); }}
            onBlur={() => setF((v) => ({ ...v, slug: slugify(v.slug) }))}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="al-cat" hint="The album’s photos also appear in this gallery tab.">
            <Select id="al-cat" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              <option value="">No category</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </Field>
          <Field label="Event date" htmlFor="al-date">
            <Input id="al-date" type="date" value={f.eventDate} onChange={(e) => setF({ ...f, eventDate: e.target.value })} />
          </Field>
        </div>
        <Field label="Description" htmlFor="al-desc" hint={`${f.description.length}/600`}>
          <Textarea id="al-desc" value={f.description} maxLength={600} rows={3} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <Checkbox label="Published" hint="Show this album on the gallery page (it needs at least one photo)." checked={f.published} onChange={(published) => setF({ ...f, published })} />
        <ErrorNote>{error}</ErrorNote>
      </form>
    </Dialog>
  );
}
