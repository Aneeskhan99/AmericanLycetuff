"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Field, PageDef, Patch } from "@/lib/content";
import { ApiError, useAdmin } from "../AdminProvider";
import { Badge, Button, ConfirmDialog, Dialog, Empty, ErrorNote, fmtDate, Select } from "../ui";
import { ChangedDot, FieldBlock } from "./FieldEditors";
import { changedPaths, deepEqual, labelOf } from "./patch";
import VisualEditor from "./VisualEditor";

type Meta = { rev: string; publishedAt: string | null; publishedBy: string | null; draftUpdatedAt: string | null; draftUpdatedBy: string | null };
type ServerState = { published: Patch; draft: Patch | null; hasDraft: boolean; meta: Meta };
type Loaded = ServerState & { page: Pick<PageDef, "key" | "title" | "path" | "sections"> };
type Revision = { id: number; publishedAt: string; publishedBy: string | null; customised: number; changed: { path: string; label: string }[] };

const SAVE_DELAY = 1500;
const clock = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" });

export default function PageEditor({ pageKey }: { pageKey: string }) {
  const { api, toast } = useAdmin();
  const [page, setPage] = useState<Loaded["page"] | null>(null);
  const [server, setServer] = useState<ServerState | null>(null);
  const [work, setWork] = useState<Patch>({});
  const [loadError, setLoadError] = useState("");
  const [section, setSection] = useState("");

  // Autosave bookkeeping. Refs hold the truth for async code; state drives the UI.
  const workRef = useRef<Patch>({});
  const revRef = useRef("new");
  const editSeq = useRef(0);
  const savedSeq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<boolean>>(Promise.resolve(true));
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [busy, setBusy] = useState<"" | "publish" | "discard" | "reset" | "preview">("");
  const [confirm, setConfirm] = useState<"" | "publish" | "discard" | "reset">("");
  const [history, setHistory] = useState(false);
  /** Visual: the live page with click-to-edit (computers). Form: the section-by-section fields. */
  const [mode, setMode] = useState<"visual" | "form">("visual");
  const [saveTick, setSaveTick] = useState(0);

  /** Adopt a state returned by the server as the new baseline (no pending edits). */
  const adopt = useCallback((s: ServerState) => {
    setServer(s);
    revRef.current = s.meta.rev;
    const w = s.draft ?? s.published;
    workRef.current = w;
    setWork(w);
    savedSeq.current = editSeq.current;
    setPending(false);
    setSaveError("");
    setConflict(false);
  }, []);

  useEffect(() => {
    let live = true;
    api<Loaded>(`/api/admin/pages/${encodeURIComponent(pageKey)}`)
      .then((d) => {
        if (!live) return;
        setPage(d.page);
        setSection((s) => s || Object.keys(d.page.sections)[0] || "");
        adopt(d);
      })
      .catch((e: Error) => live && setLoadError(e.message));
    return () => {
      live = false;
    };
  }, [api, pageKey, adopt]);

  // ---------------------------------------------------------------- saving
  const doSave = useCallback(async (): Promise<boolean> => {
    if (editSeq.current === savedSeq.current) return true;
    const seq = editSeq.current;
    const patch = workRef.current;
    setSaving(true);
    try {
      const s = await api<ServerState>(`/api/admin/pages/${encodeURIComponent(pageKey)}/draft`, { method: "PUT", body: { patch, rev: revRef.current } });
      revRef.current = s.meta.rev;
      setServer(s);
      savedSeq.current = seq;
      if (editSeq.current === seq) setPending(false);
      setSavedAt(new Date());
      setSaveError("");
      setSaveTick((t) => t + 1);
      return true;
    } catch (e) {
      setSaveError((e as Error).message);
      if (e instanceof ApiError && e.status === 409) setConflict(true);
      return false;
    } finally {
      setSaving(false);
    }
  }, [api, pageKey]);

  /** Saves now (waiting for any save in flight). Resolves false if the save failed. */
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    chain.current = chain.current.then(doSave, doSave);
    return chain.current;
  }, [doSave]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_DELAY);
  }, [flush]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const fieldOf = useCallback((path: string): Field | undefined => {
    const [sid, fid] = path.split(".");
    return page?.sections[sid]?.fields[fid];
  }, [page]);

  const setValue = useCallback((path: string, v: unknown) => {
    const field = fieldOf(path);
    if (!field || conflict) return;
    const n = { ...workRef.current };
    if (deepEqual(v, field.default)) delete n[path];
    else n[path] = v;
    workRef.current = n;
    setWork(n);
    editSeq.current++;
    setPending(true);
    schedule();
  }, [fieldOf, schedule, conflict]);

  // Warn before leaving with edits that are not saved yet.
  const unsaved = pending || saving || Boolean(saveError);
  useEffect(() => {
    if (!unsaved) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      void flush();
      e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (!window.confirm("Your latest edits have not been saved yet. Leave this page anyway?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [unsaved, flush]);

  // ---------------------------------------------------------------- derived
  const published = useMemo(() => server?.published ?? {}, [server]);
  const changed = useMemo(() => (page ? changedPaths(page as PageDef, published, work) : []), [page, published, work]);
  const changedSet = useMemo(() => new Set(changed), [changed]);
  const hasUnpublished = changed.length > 0;
  const hasDraft = Boolean(server?.draft) || pending;
  const sectionIds = page ? Object.keys(page.sections) : [];
  const current = page && section ? page.sections[section] : undefined;
  const fieldTotal = page ? Object.values(page.sections).reduce((n, s) => n + Object.keys(s.fields).length, 0) : 0;

  // ---------------------------------------------------------------- actions
  const run = async (kind: "publish" | "discard" | "reset", path: string, body: Record<string, unknown>, done: string) => {
    setBusy(kind);
    try {
      if (kind !== "discard" && !(await flush())) {
        toast("Your latest edits could not be saved. Fix the problem shown and try again.", "error");
        return;
      }
      if (kind === "discard" && timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        await chain.current;
      }
      const s = await api<ServerState>(`/api/admin/pages/${encodeURIComponent(pageKey)}/${path}`, { body: { ...body, rev: revRef.current } });
      adopt(s);
      setSavedAt(null);
      toast(done);
      setConfirm("");
    } catch (e) {
      toast((e as Error).message, "error");
      if (e instanceof ApiError && e.status === 409) setConflict(true);
    } finally {
      setBusy("");
    }
  };

  const preview = async () => {
    // Open the tab now (inside the click) so pop-up blockers allow it, then point it at the preview once saved.
    const w = window.open("", "_blank");
    setBusy("preview");
    try {
      const ok = await flush();
      if (!ok) {
        w?.close();
        toast("Your latest edits could not be saved, so the preview would be out of date.", "error");
        return;
      }
      const url = `/api/admin/pages/preview?key=${encodeURIComponent(pageKey)}`;
      if (w) w.location.href = url;
      else window.open(url, "_self");
    } finally {
      setBusy("");
    }
  };

  // ---------------------------------------------------------------- render
  if (loadError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <ErrorNote>{loadError}</ErrorNote>
      </div>
    );
  }
  if (!page || !server) return <p className="py-14 text-center text-[14px] text-[#667085]">Loading…</p>;

  const status = conflict ? (
    <span className="text-[#b42318]">Someone else changed this page. <button type="button" className="font-medium underline" onClick={() => window.location.reload()}>Reload</button></span>
  ) : saving ? (
    <span>Saving…</span>
  ) : saveError ? (
    <span className="text-[#b42318]">Not saved: {saveError}</span>
  ) : pending ? (
    <span>Unsaved changes…</span>
  ) : savedAt ? (
    <span>Saved draft · {clock(savedAt)}</span>
  ) : server.hasDraft && server.meta.draftUpdatedAt ? (
    <span>Draft saved {fmtDate(server.meta.draftUpdatedAt)}{server.meta.draftUpdatedBy ? ` by ${server.meta.draftUpdatedBy}` : ""}</span>
  ) : server.meta.publishedAt ? (
    <span>Live version published {fmtDate(server.meta.publishedAt)}{server.meta.publishedBy ? ` by ${server.meta.publishedBy}` : ""}</span>
  ) : (
    <span>Showing the original website text</span>
  );

  const pageTools = (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={() => setHistory(true)} className="rounded-md px-3 py-2 text-left text-[13px] text-[#344054] hover:bg-[#f2f4f7]">
        History &amp; restore…
      </button>
      <button
        type="button"
        onClick={() => setConfirm("reset")}
        disabled={conflict || (Object.keys(work).length === 0)}
        className="rounded-md px-3 py-2 text-left text-[13px] text-[#b42318] hover:bg-[#fef3f2] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Reset whole page to default…
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <BackLink />

      {/* Sticky action bar */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-[#eaecf0] bg-[#f5f6f8]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[20px] font-semibold text-[#101828]">{page.title}</h1>
              {hasUnpublished ? <Badge tone="amber">Unpublished changes</Badge> : <Badge tone="green">Published</Badge>}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-[#667085]" aria-live="polite">
              <a href={page.path} target="_blank" rel="noreferrer" className="font-mono text-[12px] hover:underline">{page.path}</a>
              <span aria-hidden>·</span>
              {status}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {fieldTotal > 0 && (
              <div className="hidden rounded-lg border border-[#d0d5dd] bg-white p-0.5 lg:flex" role="group" aria-label="Editor view">
                {(["visual", "form"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={`rounded-md px-3 py-1.5 text-[13px] font-medium ${mode === m ? "bg-[#1a2d59] text-white" : "text-[#475467] hover:bg-[#f2f4f7]"}`}
                  >
                    {m === "visual" ? "Visual editor" : "Form"}
                  </button>
                ))}
              </div>
            )}
            {hasDraft && (
              <Button tone="ghost" onClick={() => setConfirm("discard")} disabled={!!busy}>Discard draft</Button>
            )}
            <Button tone="secondary" onClick={preview} busy={busy === "preview"} disabled={conflict || (!!busy && busy !== "preview")}>
              Preview
            </Button>
            <Button onClick={() => setConfirm("publish")} disabled={!hasUnpublished || conflict || !!busy}>
              Publish{hasUnpublished ? ` (${changed.length})` : ""}
            </Button>
          </div>
        </div>
      </div>

      {fieldTotal > 0 && mode === "visual" && (
        <div className="relative hidden lg:left-1/2 lg:block lg:w-[calc(100vw-260px-56px)] lg:-translate-x-1/2">
          {conflict && (
            <div className="mb-3">
              <ErrorNote>
                {saveError || "This page was changed by someone else."} <button type="button" className="font-medium underline" onClick={() => window.location.reload()}>Reload now</button>
              </ErrorNote>
            </div>
          )}
          {saveError && !conflict && <div className="mb-3"><ErrorNote>{saveError}</ErrorNote></div>}
          <VisualEditor page={page} work={work} changedSet={changedSet} setValue={setValue} saveTick={saveTick} />
          <div className="mt-3 flex justify-end">{pageTools}</div>
        </div>
      )}

      {fieldTotal === 0 ? (
        <div className="rounded-xl border border-[#eaecf0] bg-white">
          <Empty title="Nothing to edit on this page yet">Its editable fields have not been set up in the website code yet.</Empty>
        </div>
      ) : (
        <div className={`grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] ${mode === "visual" ? "lg:hidden" : ""}`}>
          {/* Section navigation */}
          <aside className="lg:sticky lg:top-[112px] lg:max-h-[calc(100dvh-136px)] lg:self-start lg:overflow-y-auto">
            <div className="lg:hidden">
              <label htmlFor="section-pick" className="mb-1.5 block text-[13px] font-medium text-[#344054]">Section</label>
              <Select id="section-pick" value={section} onChange={(e) => setSection(e.target.value)}>
                {sectionIds.map((sid) => {
                  const n = Object.keys(page.sections[sid].fields).filter((fid) => changedSet.has(`${sid}.${fid}`)).length;
                  return <option key={sid} value={sid}>{page.sections[sid].label}{n ? ` (${n} changed)` : ""}</option>;
                })}
              </Select>
            </div>
            <nav aria-label="Page sections" className="hidden rounded-xl border border-[#eaecf0] bg-white p-2 lg:block">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">Sections</p>
              <ul className="flex flex-col gap-0.5">
                {sectionIds.map((sid) => {
                  const s = page.sections[sid];
                  const n = Object.keys(s.fields).filter((fid) => changedSet.has(`${sid}.${fid}`)).length;
                  const on = sid === section;
                  return (
                    <li key={sid}>
                      <button
                        type="button"
                        onClick={() => { setSection(sid); window.scrollTo({ top: 0 }); }}
                        aria-current={on ? "true" : undefined}
                        className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[14px] ${on ? "bg-[#eff4ff] font-medium text-[#1a2d59]" : "text-[#344054] hover:bg-[#f2f4f7]"}`}
                      >
                        <span className="min-w-0 truncate">{s.label}</span>
                        {n > 0 && <ChangedDot title={`${n} field${n === 1 ? "" : "s"} changed since the last publish`} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 border-t border-[#eaecf0] pt-2">{pageTools}</div>
            </nav>
          </aside>

          {/* Fields of the chosen section */}
          <div className="flex min-w-0 flex-col gap-4">
            <details className="rounded-xl border border-[#d1e0ff] bg-[#f5f8ff] px-4 py-3 text-[13px] text-[#344054]">
              <summary className="cursor-pointer font-medium text-[#1a2d59]">How editing works</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Your edits save automatically as a <strong>draft</strong>. Visitors see them only after you press <strong>Publish</strong>.</li>
                <li><strong>Preview</strong> opens the page in a new tab showing your draft.</li>
                <li>In text, put stars around words to highlight them in <span className="font-medium text-[#d31245]">crimson</span>: <code className="rounded bg-white px-1">Every Stage, under *One Roof*</code>.</li>
                <li>Where a box has several lines, a new line becomes a line break on the page.</li>
                <li>An orange dot <ChangedDot /> marks a field that differs from the live page. <strong>Reset to default</strong> puts the original website text back.</li>
              </ul>
            </details>

            {saveError && !conflict && <ErrorNote>{saveError}</ErrorNote>}
            {conflict && (
              <ErrorNote>
                {saveError || "This page was changed by someone else."} <button type="button" className="font-medium underline" onClick={() => window.location.reload()}>Reload now</button>
              </ErrorNote>
            )}

            {current && (
              <>
                <div>
                  <h2 className="text-[17px] font-semibold text-[#101828]">{current.label}</h2>
                  {current.description && <p className="mt-0.5 text-[13px] text-[#667085]">{current.description}</p>}
                </div>
                {Object.entries(current.fields).map(([fid, field]) => {
                  const path = `${section}.${fid}`;
                  const isCustom = Object.prototype.hasOwnProperty.call(work, path);
                  return (
                    <FieldBlock
                      key={path}
                      path={path}
                      field={field}
                      value={isCustom ? work[path] : field.default}
                      isCustom={isCustom}
                      changed={changedSet.has(path)}
                      onChange={(v) => setValue(path, v)}
                      onReset={() => setValue(path, structuredClone(field.default))}
                    />
                  );
                })}
                <SectionPager ids={sectionIds} page={page} section={section} onGo={(sid) => { setSection(sid); window.scrollTo({ top: 0 }); }} />
              </>
            )}
            <div className="rounded-xl border border-[#eaecf0] bg-white p-2 lg:hidden">{pageTools}</div>
          </div>
        </div>
      )}

      {/* Publish */}
      <ConfirmDialog
        open={confirm === "publish"}
        title="Publish these changes?"
        tone="primary"
        confirmLabel="Publish now"
        busy={busy === "publish"}
        onCancel={() => setConfirm("")}
        onConfirm={() => run("publish", "publish", {}, "Published. Visitors now see the new version.")}
        message={
          <>
            <p className="mb-2">These {changed.length} field{changed.length === 1 ? "" : "s"} will change on the live page <span className="font-mono text-[12px]">{page.path}</span>:</p>
            <ul className="max-h-60 list-disc overflow-y-auto pl-5 text-[13px] text-[#344054]">
              {changed.map((p) => <li key={p}>{labelOf(page as PageDef, p)}{!Object.prototype.hasOwnProperty.call(work, p) && <span className="text-[#667085]"> (back to default)</span>}</li>)}
            </ul>
          </>
        }
      />
      <ConfirmDialog
        open={confirm === "discard"}
        title="Discard the draft?"
        confirmLabel="Discard draft"
        busy={busy === "discard"}
        onCancel={() => setConfirm("")}
        onConfirm={() => run("discard", "discard", {}, "Draft discarded.")}
        message="All unpublished changes to this page will be thrown away and the editor will show the live version again. This cannot be undone."
      />
      <ConfirmDialog
        open={confirm === "reset"}
        title="Reset the whole page to default?"
        confirmLabel="Reset page"
        busy={busy === "reset"}
        onCancel={() => setConfirm("")}
        onConfirm={() => run("reset", "reset", {}, "Every field is back to the original text in the draft. Publish to make it live.")}
        message="Every field on this page goes back to the original website text. This only changes the draft: visitors keep seeing the current page until you publish."
      />
      {history && (
        <HistoryDialog
          page={page as PageDef}
          hasUnpublished={hasUnpublished}
          onClose={() => setHistory(false)}
          onRestore={async (id) => {
            if (!(await flush())) {
              toast("Your latest edits could not be saved. Fix the problem shown and try again.", "error");
              return false;
            }
            try {
              const s = await api<ServerState>(`/api/admin/pages/${encodeURIComponent(pageKey)}/revisions/${id}/restore`, { body: { rev: revRef.current } });
              adopt(s);
              setSavedAt(new Date());
              toast("That version is now in the draft. Preview it, then publish to make it live.");
              return true;
            } catch (e) {
              toast((e as Error).message, "error");
              if (e instanceof ApiError && e.status === 409) setConflict(true);
              return false;
            }
          }}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/pages" className="inline-flex w-fit items-center gap-1 text-[13px] font-medium text-[#475467] hover:text-[#101828]">
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m15 18-6-6 6-6" /></svg>
      All pages
    </Link>
  );
}

function SectionPager({ ids, page, section, onGo }: { ids: string[]; page: Loaded["page"]; section: string; onGo: (sid: string) => void }) {
  const i = ids.indexOf(section);
  const prev = i > 0 ? ids[i - 1] : null;
  const next = i < ids.length - 1 ? ids[i + 1] : null;
  if (!prev && !next) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      {prev ? <Button tone="secondary" size="sm" onClick={() => onGo(prev)}>← {page.sections[prev].label}</Button> : <span />}
      {next ? <Button tone="secondary" size="sm" onClick={() => onGo(next)}>{page.sections[next].label} →</Button> : <span />}
    </div>
  );
}

// ------------------------------------------------------------------ history
function HistoryDialog({ page, hasUnpublished, onClose, onRestore }: {
  page: PageDef; hasUnpublished: boolean; onClose: () => void; onRestore: (id: number) => Promise<boolean>;
}) {
  const { api, toast } = useAdmin();
  const [rows, setRows] = useState<Revision[] | null>(null);
  const [restoring, setRestoring] = useState<Revision | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ rows: Revision[] }>(`/api/admin/pages/${encodeURIComponent(page.key)}/revisions`)
      .then((d) => setRows(d.rows))
      .catch((e: Error) => toast(e.message, "error"));
  }, [api, toast, page.key]);

  return (
    <>
      <Dialog open title={`History: ${page.title}`} onClose={onClose} wide footer={<Button tone="secondary" onClick={onClose}>Close</Button>}>
        <p className="mb-4 text-[13px] text-[#667085]">Every publish is kept. Restoring a version copies it into the draft, so you can preview it before publishing.</p>
        {!rows ? (
          <p className="py-8 text-center text-[14px] text-[#667085]">Loading…</p>
        ) : rows.length === 0 ? (
          <Empty title="Not published yet">Versions appear here each time the page is published.</Empty>
        ) : (
          <ol className="flex flex-col gap-3">
            {rows.map((r, i) => (
              <li key={r.id} className="rounded-lg border border-[#eaecf0] p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[#101828]">
                      {fmtDate(r.publishedAt)}
                      {i === 0 && <span className="ml-2"><Badge tone="green">Live now</Badge></span>}
                    </p>
                    <p className="text-[12px] text-[#667085]">
                      Published by {r.publishedBy ?? "a removed user"} · {r.customised} field{r.customised === 1 ? "" : "s"} different from default
                    </p>
                  </div>
                  <Button tone="secondary" size="sm" onClick={() => setRestoring(r)} className="shrink-0">Restore into draft</Button>
                </div>
                {r.changed.length > 0 ? (
                  <details className="mt-2 text-[12px] text-[#475467]">
                    <summary className="cursor-pointer">{r.changed.length} field{r.changed.length === 1 ? "" : "s"} changed</summary>
                    <ul className="mt-1 list-disc pl-5">
                      {r.changed.map((c) => <li key={c.path}>{c.label}</li>)}
                    </ul>
                  </details>
                ) : (
                  <p className="mt-2 text-[12px] text-[#98a2b3]">No field changes recorded</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Dialog>
      <ConfirmDialog
        open={Boolean(restoring)}
        title="Restore this version into the draft?"
        tone="primary"
        confirmLabel="Restore into draft"
        busy={busy}
        onCancel={() => setRestoring(null)}
        onConfirm={async () => {
          if (!restoring) return;
          setBusy(true);
          const ok = await onRestore(restoring.id);
          setBusy(false);
          setRestoring(null);
          if (ok) onClose();
        }}
        message={
          <>
            The draft will be replaced with the version published {restoring ? fmtDate(restoring.publishedAt) : ""}.
            {hasUnpublished && <strong className="mt-2 block font-medium text-[#b54708]">Your current unpublished changes will be replaced.</strong>}
            <span className="mt-2 block">The live page does not change until you publish.</span>
          </>
        }
      />
    </>
  );
}
