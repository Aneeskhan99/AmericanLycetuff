"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdmin } from "../AdminProvider";
import MediaPicker, { thumbUrl, type PickedMedia } from "../MediaPicker";
import { move } from "../media/Reorder";
import { ACCEPT, DropZone, UploadList, useUploader } from "../media/upload";
import { Badge, Button, Card, ConfirmDialog, Empty, ErrorNote, Input, PageHeader } from "../ui";
import AlbumDialog, { categoryLabel, type Album, type AlbumMedia } from "./AlbumDialog";
import { fmtDay } from "./AlbumsScreen";

type Photo = { id: number; caption: string; media: AlbumMedia };
type DetailRes = { album: Album; photos: Photo[] };

/** One album: details, cover, and its photos (upload, add from library, captions, order, remove). */
export default function AlbumDetail({ id }: { id: number }) {
  const { api, toast } = useAdmin();
  const router = useRouter();
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saved, setSaved] = useState<Photo[]>([]);
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [removing, setRemoving] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState<number | null>(null);
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  });

  const load = useCallback(async () => {
    try {
      const d = await api<DetailRes>(`/api/admin/albums/${id}`);
      setAlbum(d.album);
      setPhotos(d.photos);
      setSaved(d.photos);
    } catch (e) {
      if ((e as { status?: number }).status === 404) setMissing(true);
      else toast((e as Error).message, "error");
    }
  }, [api, toast, id]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const dirty = JSON.stringify(photos.map((p) => [p.id, p.caption])) !== JSON.stringify(saved.map((p) => [p.id, p.caption]));

  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  });

  /** Saves captions + order (also called before attach/remove so nothing typed is lost). */
  const saveList = useCallback(async (quiet = false) => {
    const list = photosRef.current;
    await api(`/api/admin/albums/${id}/photos`, { method: "PUT", body: { photos: list.map((p) => ({ id: p.id, caption: p.caption })) } });
    setSaved(list);
    if (!quiet) toast("Photos saved");
  }, [api, id, toast]);

  const attach = useCallback(async (media: PickedMedia[]) => {
    const images = media.filter((m) => m.kind === "image");
    if (!images.length) return;
    try {
      if (dirtyRef.current) await saveList(true);
      const r = await api<{ added: number; skipped: number }>(`/api/admin/albums/${id}/photos`, { body: { mediaIds: images.map((m) => m.id) } });
      toast(`${r.added} photo${r.added === 1 ? "" : "s"} added${r.skipped ? ` (${r.skipped} already in the album)` : ""}`);
      await load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }, [api, id, load, saveList, toast]);

  const uploader = useUploader({ kind: "image", onDone: attach });

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await saveList();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const setCover = async (p: Photo | null) => {
    try {
      await api(`/api/admin/albums/${id}`, { method: "PATCH", body: { coverMediaId: p?.media.id ?? null } });
      toast(p ? "Cover updated" : "Cover reset to the first photo");
      const d = await api<DetailRes>(`/api/admin/albums/${id}`);
      setAlbum(d.album);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      if (dirty) await saveList(true);
      await api(`/api/admin/albums/${id}/photos/${removing.id}`, { method: "DELETE" });
      toast("Photo removed from the album");
      setRemoving(null);
      await load();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteAlbum = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/albums/${id}`, { method: "DELETE" });
      toast("Album deleted");
      router.push("/admin/gallery");
    } catch (e) {
      toast((e as Error).message, "error");
      setBusy(false);
    }
  };

  if (missing) {
    return (
      <Card>
        <Empty title="Album not found">
          It may have been deleted. <Link href="/admin/gallery" className="text-[#1a2d59] underline">Back to albums</Link>
        </Empty>
      </Card>
    );
  }
  if (!album) return <p className="py-14 text-center text-[14px] text-[#667085]">Loading…</p>;

  const coverId = album.cover_media_id;
  const live = album.published && photos.length > 0;

  return (
    <>
      <Link href="/admin/gallery" className="mb-3 inline-block text-[13px] text-[#475467] hover:underline">← All albums</Link>
      <PageHeader
        title={album.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {live ? <Badge tone="green">Published</Badge> : album.published ? <Badge tone="amber">Published, but needs photos</Badge> : <Badge>Hidden</Badge>}
            {categoryLabel(album.category) && <Badge tone="blue">{categoryLabel(album.category)}</Badge>}
            {album.event_date && <span>{fmtDay(album.event_date)}</span>}
            {live ? (
              <Link href={`/gallery/${album.slug}`} target="_blank" className="font-mono text-[13px] text-[#1a2d59] underline">/gallery/{album.slug}</Link>
            ) : (
              <span className="font-mono text-[13px]">/gallery/{album.slug}</span>
            )}
          </span>
        }
        actions={
          <>
            <Button tone="secondary" onClick={() => setEditing(true)}>Edit details</Button>
            <Button tone="danger" onClick={() => setDeleting(true)}>Delete album</Button>
          </>
        }
      />
      {album.description && <p className="-mt-3 mb-5 max-w-[720px] text-[14px] text-[#475467]">{album.description}</p>}

      <div className="mb-4 flex flex-col gap-3">
        <DropZone
          accept={ACCEPT.image}
          label="Drag photos here to upload them straight into this album"
          hint="JPG, PNG, WebP or GIF, up to 15 MB each. They are added to the media library too."
          busy={uploader.busy}
          onFiles={(f) => void uploader.add(f.slice(0, 30))}
        >
          <Button type="button" tone="secondary" onClick={() => setPicking(true)}>Add from library</Button>
        </DropZone>
        <UploadList items={uploader.items} onClear={uploader.clear} />
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b border-[#eaecf0] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold">Photos ({photos.length})</h2>
            <p className="text-[12px] text-[#667085]">Drag a photo (or use the arrows) to change the order. Captions show in the photo viewer.</p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && <span className="text-[12px] text-[#b54708]">Unsaved changes</span>}
            {dirty && <Button tone="secondary" size="sm" onClick={() => setPhotos(saved)}>Undo</Button>}
            <Button size="sm" busy={busy && !removing} disabled={!dirty} onClick={save}>Save order & captions</Button>
          </div>
        </div>
        <div className="px-4 pt-3"><ErrorNote>{error}</ErrorNote></div>

        {photos.length === 0 ? (
          <Empty title="No photos yet">Upload photos above or add them from the media library.</Empty>
        ) : (
          <ul className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Album photos">
            {photos.map((p, i) => {
              const isCover = coverId ? coverId === p.media.id : i === 0;
              return (
                <li
                  key={p.id}
                  draggable
                  data-photo-id={p.id}
                  onDragStart={(e) => { setDrag(i); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={(e) => {
                    if (drag === null) return;
                    e.preventDefault();
                    if (drag !== i) { setPhotos((l) => move(l, drag, i)); setDrag(i); }
                  }}
                  onDragEnd={() => setDrag(null)}
                  className={`flex flex-col overflow-hidden rounded-lg border bg-white ${drag === i ? "border-[#1a2d59] opacity-70" : "border-[#eaecf0]"}`}
                >
                  <div className="relative aspect-[4/3] cursor-grab bg-[#f2f4f7] active:cursor-grabbing">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl(p.media)} alt={p.media.alt} className="absolute inset-0 size-full object-cover" loading="lazy" draggable={false} />
                    <span className="absolute left-2 top-2 rounded bg-white/90 px-1.5 text-[12px] font-semibold tabular-nums text-[#344054]">{i + 1}</span>
                    {isCover && <span className="absolute right-2 top-2"><Badge tone="blue">Cover</Badge></span>}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-2.5">
                    <Input
                      value={p.caption}
                      maxLength={300}
                      placeholder="Caption (optional)"
                      aria-label={`Caption for photo ${i + 1}`}
                      onChange={(e) => setPhotos((l) => l.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)))}
                      className="h-9 text-[13px]"
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      <Button type="button" tone="ghost" size="sm" disabled={i === 0} onClick={() => setPhotos((l) => move(l, i, i - 1))} aria-label={`Move photo ${i + 1} earlier`}>←</Button>
                      <Button type="button" tone="ghost" size="sm" disabled={i === photos.length - 1} onClick={() => setPhotos((l) => move(l, i, i + 1))} aria-label={`Move photo ${i + 1} later`}>→</Button>
                      {!isCover && <Button type="button" tone="ghost" size="sm" onClick={() => setCover(p)}>Set as cover</Button>}
                      {isCover && coverId && <Button type="button" tone="ghost" size="sm" onClick={() => setCover(null)}>Use first photo</Button>}
                      <Button type="button" tone="ghost" size="sm" className="ml-auto text-[#b42318]" onClick={() => setRemoving(p)}>Remove</Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {dirty && (
        <div className="sticky bottom-4 z-10 mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#eaecf0] bg-white px-4 py-3 shadow-lg">
          <span className="text-[13px] text-[#344054]">You have unsaved changes to the order or captions.</span>
          <Button size="sm" busy={busy && !removing} onClick={save}>Save</Button>
        </div>
      )}

      <MediaPicker
        open={picking}
        kind="image"
        multiple
        title="Add images to this album"
        onClose={() => setPicking(false)}
        onPick={(items) => { setPicking(false); void attach(items); }}
      />
      {editing && (
        <AlbumDialog
          album={album}
          onClose={() => setEditing(false)}
          onDone={() => { setEditing(false); void api<DetailRes>(`/api/admin/albums/${id}`).then((d) => setAlbum(d.album)); }}
        />
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this photo from the album?"
        message="It will no longer show in this album. The image stays in the media library."
        confirmLabel="Remove"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
      <ConfirmDialog
        open={deleting}
        title="Delete this album?"
        message={<><strong>{album.title}</strong> and its list of {photos.length} photos will be removed from the gallery. The images stay in the media library. This cannot be undone.</>}
        confirmLabel="Delete album"
        busy={busy}
        onConfirm={deleteAlbum}
        onCancel={() => setDeleting(false)}
      />
    </>
  );
}
