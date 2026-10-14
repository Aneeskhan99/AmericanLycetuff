"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Field, ImageValue, LinkValue, PageDef, Patch, ScalarField } from "@/lib/content";
import type { Settings } from "@/lib/settings";
import type { BridgeField, BridgeTarget } from "@/components/site/EditBridge";
import { useAdmin } from "../AdminProvider";
import { AnnouncementGroup, BrandingGroup, ContactGroup, FooterGroup, HoursGroup, SocialGroup } from "../settings/SettingsScreen";
import { Button, ErrorNote } from "../ui";
import { FieldBlock, ScalarInput } from "./FieldEditors";

type Page = Pick<PageDef, "key" | "title" | "path" | "sections">;
type ListField = Extract<Field, { type: "list" }>;
type Device = "desktop" | "tablet" | "phone";
type SettingsRes = { settings: Settings; updated: Record<string, { at: string; by: string | null }> };

/** Page widths the frame is rendered at; it is scaled down to fit the editor when needed. */
const DEVICES: { id: Device; label: string; width: number }[] = [
  { id: "desktop", label: "Computer", width: 1440 },
  { id: "tablet", label: "Tablet", width: 820 },
  { id: "phone", label: "Phone", width: 390 },
];

/** What the bridge needs to find a scalar value on the page. */
function scalar(field: ScalarField, v: unknown): Pick<BridgeField, "kind" | "value"> | null {
  switch (field.type) {
    case "text":
    case "textarea":
      return { kind: "text", value: String(v ?? "") };
    case "link":
      return { kind: "link", value: (v as LinkValue | undefined)?.label ?? "" };
    case "image":
      return { kind: "image", value: (v as ImageValue | undefined)?.src ?? "" };
  }
}

/** Every editable value of the page, flattened for the bridge (list items included). */
function bridgeFields(page: Page, work: Patch): BridgeField[] {
  const out: BridgeField[] = [];
  for (const [sid, s] of Object.entries(page.sections)) {
    for (const [fid, f] of Object.entries(s.fields)) {
      const path = `${sid}.${fid}`;
      const v = Object.prototype.hasOwnProperty.call(work, path) ? work[path] : f.default;
      if (f.type === "list") {
        (v as Record<string, unknown>[]).forEach((item, i) => {
          for (const [k, sub] of Object.entries(f.item)) {
            const sc = scalar(sub, item[k]);
            if (sc) out.push({ path, item: i, sub: k, ...sc, label: `${s.label} › ${f.label} ${i + 1} › ${sub.label}` });
          }
        });
      } else {
        const sc = scalar(f, v);
        if (sc) out.push({ path, ...sc, label: `${s.label} › ${f.label}` });
      }
    }
  }
  return out;
}

const SITE_GROUP_TEXT: Record<string, string> = {
  branding: "The crest and school name at the top of every page and in the footer.",
  announcement: "The strip at the very top of every page.",
  contact: "Phone, email and address in the footer and on the contact pages.",
  social: "The social media icons in the footer.",
  footer: "The fixed texts at the bottom of every page.",
  hours: "The office hours shown on the Contact and Enquire pages.",
};

export default function VisualEditor({ page, work, changedSet, setValue, saveTick, sectionOf }: {
  page: Page;
  work: Patch;
  changedSet: Set<string>;
  setValue: (path: string, v: unknown) => void;
  /** Increments after every successful draft save. */
  saveTick: number;
  /** Lets the parent show a section in Form view. */
  sectionOf?: (sid: string) => void;
}) {
  const { api, user } = useAdmin();
  const frame = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [sel, setSel] = useState<BridgeTarget | null>(null);
  const [browse, setBrowse] = useState("");
  const [found, setFound] = useState<Set<string> | null>(null);
  const [whole, setWhole] = useState(false);
  const [settings, setSettings] = useState<SettingsRes | null>(null);
  const [settingsError, setSettingsError] = useState("");
  const [loading, setLoading] = useState(true);
  const needReload = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scrollY = useRef(0);
  const workRef = useRef(work);
  const scaleRef = useRef(1);
  const selRef = useRef<BridgeTarget | null>(null);
  useEffect(() => {
    workRef.current = work;
    selRef.current = sel;
  });

  const src = `/api/admin/pages/preview?key=${encodeURIComponent(page.key)}&edit=1`;

  const post = useCallback((msg: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ als: 1, ...msg }, window.location.origin);
  }, []);

  const deviceWidth = DEVICES.find((d) => d.id === device)!.width;
  const liveScale = box.w ? Math.min(1, (box.w - 16) / deviceWidth) : 1;
  useEffect(() => {
    scaleRef.current = liveScale;
  });
  useEffect(() => {
    post({ type: "scale", scale: liveScale });
  }, [liveScale, post]);

  const sendFields = useCallback(() => {
    const s = selRef.current;
    post({ type: "fields", fields: bridgeFields(page, workRef.current), selected: s ? (s.kind === "site" ? `site:${s.group}` : s.key) : "" });
  }, [page, post]);

  const reload = useCallback(() => {
    const w = frame.current?.contentWindow;
    if (!w) return;
    try {
      scrollY.current = w.scrollY;
      w.location.reload();
      setLoading(true);
    } catch {
      /* not loaded yet */
    }
  }, []);

  // Messages from the page in the frame.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const m = e.data as { als?: number; type?: string } & Record<string, unknown>;
      if (!m || m.als !== 1) return;
      if (m.type === "hello") {
        setLoading(false);
        sendFields();
        post({ type: "scale", scale: scaleRef.current });
        if (scrollY.current) frame.current?.contentWindow?.scrollTo(0, scrollY.current);
      } else if (m.type === "tagged") setFound(new Set(m.found as string[]));
      else if (m.type === "select") {
        setSel(m.target as BridgeTarget);
        setBrowse("");
        setWhole(false);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendFields, post]);

  // After a save that changed a list's length, reload so new or removed items render properly.
  useEffect(() => {
    if (saveTick && needReload.current) {
      needReload.current = false;
      reload();
    }
  }, [saveTick, reload]);

  // Settings (header/footer parts) are administrator-only.
  const isAdmin = user.role === "administrator";
  const wantSettings = sel?.kind === "site" && isAdmin && !settings;
  useEffect(() => {
    if (!wantSettings) return;
    let live = true;
    api<SettingsRes>("/api/admin/settings").then((d) => live && setSettings(d)).catch((e: Error) => live && setSettingsError(e.message));
    return () => {
      live = false;
    };
  }, [wantSettings, api]);

  /** Edit a field: update the draft and show the change in the frame straight away. */
  const change = (path: string, v: unknown) => {
    const [sid, fid] = path.split(".");
    const f = page.sections[sid]?.fields[fid];
    if (!f) return;
    const before = Object.prototype.hasOwnProperty.call(work, path) ? work[path] : f.default;
    setValue(path, v);
    if (f.type === "list") {
      const items = v as Record<string, unknown>[];
      if (items.length !== (before as unknown[]).length) needReload.current = true;
      else
        items.forEach((item, i) => {
          for (const [k, sub] of Object.entries(f.item)) {
            const sc = scalar(sub, item[k]);
            if (sc && JSON.stringify(item[k]) !== JSON.stringify((before as Record<string, unknown>[])[i]?.[k])) post({ type: "value", field: { path, item: i, sub: k, ...sc } });
          }
        });
    } else {
      const sc = scalar(f, v);
      if (sc) post({ type: "value", field: { path, ...sc } });
    }
  };

  const valueOf = (path: string) => {
    const [sid, fid] = path.split(".");
    const f = page.sections[sid]?.fields[fid];
    return Object.prototype.hasOwnProperty.call(work, path) ? work[path] : f?.default;
  };

  const focus = (key: string) => post({ type: "focus", key });

  const fieldBlock = (path: string) => {
    const [sid, fid] = path.split(".");
    const f = page.sections[sid]?.fields[fid];
    if (!f) return null;
    const isCustom = Object.prototype.hasOwnProperty.call(work, path);
    return (
      <FieldBlock
        key={path}
        path={path}
        field={f}
        value={isCustom ? work[path] : f.default}
        isCustom={isCustom}
        changed={changedSet.has(path)}
        onChange={(v) => change(path, v)}
        onReset={() => change(path, structuredClone(f.default))}
      />
    );
  };

  // ---------------------------------------------------------------- panel
  let panel: React.ReactNode;
  if (browse && page.sections[browse]) {
    const s = page.sections[browse];
    panel = (
      <>
        <PanelTitle eyebrow="Section" title={s.label} description={s.description} onBack={() => setBrowse("")} />
        {Object.keys(s.fields).map((fid) => {
          const path = `${browse}.${fid}`;
          const onPage = found && [...found].some((k) => k === path || k.startsWith(`${path}#`));
          return (
            <div key={path} className="flex flex-col gap-1">
              {fieldBlock(path)}
              {onPage && (
                <button type="button" className="self-end text-[12px] font-medium text-[#1a2d59] hover:underline" onClick={() => focus([...found!].find((k) => k === path || k.startsWith(`${path}#`))!)}>
                  Show on page ↗
                </button>
              )}
            </div>
          );
        })}
      </>
    );
  } else if (sel?.kind === "field") {
    const [sid, fid] = sel.path.split(".");
    const s = page.sections[sid];
    const f = s?.fields[fid];
    if (!s || !f) panel = <ErrorNote>This part of the page is no longer editable. Reload the editor.</ErrorNote>;
    else if (f.type === "list" && sel.item !== undefined && !whole) {
      const items = (valueOf(sel.path) as Record<string, unknown>[]) ?? [];
      const item = items[sel.item];
      panel = (
        <>
          <PanelTitle eyebrow={s.label} title={`${f.label} · ${sel.item + 1} of ${items.length}`} onBack={() => setSel(null)} />
          {item ? (
            <div className="flex flex-col gap-4 rounded-xl border border-[#eaecf0] bg-white p-4">
              {Object.entries((f as ListField).item).map(([k, sub]) => (
                <div key={`${sel.item}-${k}`} className={`flex flex-col gap-1.5 ${k === sel.sub ? "rounded-lg bg-[#f5f8ff] p-2 ring-1 ring-[#d1e0ff]" : ""}`}>
                  <span className="text-[13px] font-medium text-[#344054]">{sub.label}</span>
                  {sub.hint && <p className="-mt-1 text-[12px] text-[#667085]">{sub.hint}</p>}
                  <ScalarInput
                    field={sub}
                    value={item[k]}
                    idBase={`ve-${sel.path.replace(/\./g, "-")}-${sel.item}-${k}`}
                    inList
                    onChange={(v) => change(sel.path, items.map((it, j) => (j === sel.item ? { ...it, [k]: v } : it)))}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#667085]">This item was removed.</p>
          )}
          <Button tone="secondary" size="sm" className="w-fit" onClick={() => setWhole(true)}>Add, remove or reorder {f.label.toLowerCase()}…</Button>
        </>
      );
    } else {
      panel = (
        <>
          <PanelTitle eyebrow={s.label} title={f.label} onBack={() => setSel(null)} />
          {fieldBlock(sel.path)}
          {/hours/i.test(`${f.label} ${f.hint ?? ""}`) ? (
            <button
              type="button"
              onClick={() => setSel({ kind: "site", group: "hours", label: "Opening hours" })}
              className="w-fit text-left text-[13px] font-medium text-[#1a2d59] hover:underline"
            >
              Change the opening hours (site setting) →
            </button>
          ) : /(phone|settings|email|address)/i.test(`${f.label} ${f.hint ?? ""}`) ? (
            <button
              type="button"
              onClick={() => setSel({ kind: "site", group: "contact", label: "Contact details" })}
              className="w-fit text-left text-[13px] font-medium text-[#1a2d59] hover:underline"
            >
              Change the phone number, email or address (site setting) →
            </button>
          ) : null}
          <Button tone="ghost" size="sm" className="w-fit" onClick={() => setBrowse(sid)}>Show everything in “{s.label}”</Button>
        </>
      );
    }
  } else if (sel?.kind === "site") {
    const g = sel.group;
    const onSaved = () => {
      setSettings(null);
      reload();
    };
    panel = (
      <>
        <PanelTitle eyebrow="Every page" title={sel.label} description={SITE_GROUP_TEXT[g]} onBack={() => setSel(null)} />
        <p className="rounded-lg border border-[#fedf89] bg-[#fffaeb] px-3 py-2 text-[12px] text-[#93370d]">
          This is a site setting, shared by every page. <strong>Save</strong> changes the live website straight away (there is no draft).
        </p>
        {!isAdmin ? (
          <p className="text-[13px] text-[#667085]">Only administrators can change site settings. Ask an administrator, or use Settings.</p>
        ) : settingsError ? (
          <ErrorNote>{settingsError}</ErrorNote>
        ) : !settings ? (
          <p className="py-6 text-center text-[13px] text-[#667085]">Loading…</p>
        ) : g === "branding" ? (
          <BrandingGroup initial={settings.settings.branding} updated={settings.updated.branding} onSaved={onSaved} />
        ) : g === "announcement" ? (
          <AnnouncementGroup initial={settings.settings.announcement} updated={settings.updated.announcement} onSaved={onSaved} />
        ) : g === "contact" ? (
          <ContactGroup initial={settings.settings.contact} updated={settings.updated.contact} onSaved={onSaved} />
        ) : g === "hours" ? (
          <HoursGroup initial={settings.settings.hours} updated={settings.updated.hours} onSaved={onSaved} />
        ) : g === "social" ? (
          <SocialGroup initial={settings.settings.social} updated={settings.updated.social} onSaved={onSaved} />
        ) : g === "footer" ? (
          <FooterGroup initial={settings.settings.footer} updated={settings.updated.footer} onSaved={onSaved} />
        ) : (
          <p className="text-[13px] text-[#667085]">Change this in Settings.</p>
        )}
      </>
    );
  } else {
    panel = (
      <>
        <div className="rounded-xl border border-[#d1e0ff] bg-[#f5f8ff] p-4 text-[13px] text-[#344054]">
          <p className="text-[15px] font-semibold text-[#1a2d59]">Click anything on the page to change it</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Text, photos and buttons get a <span className="font-medium text-[#d31245]">red outline</span> when you point at them.</li>
            <li>Changes save as a <strong>draft</strong>. Visitors see them after you press <strong>Publish</strong>.</li>
            <li>The logo, announcement bar and footer are site settings: they change every page.</li>
            <li>Use the screen buttons to check the page on a tablet or phone.</li>
          </ul>
          {found && <p className="mt-3 text-[12px] text-[#667085]">{found.size} editable item{found.size === 1 ? "" : "s"} found on this page.</p>}
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">Or pick a section</p>
          <ul className="flex flex-col gap-0.5 rounded-xl border border-[#eaecf0] bg-white p-1.5">
            {Object.entries(page.sections).map(([sid, s]) => {
              const n = Object.keys(s.fields).filter((fid) => changedSet.has(`${sid}.${fid}`)).length;
              return (
                <li key={sid}>
                  <button type="button" onClick={() => setBrowse(sid)} className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[14px] text-[#344054] hover:bg-[#f2f4f7]">
                    <span className="truncate">{s.label}</span>
                    {n > 0 && <span className="size-2 shrink-0 rounded-full bg-[#f79009]" title={`${n} changed`} />}
                  </button>
                </li>
              );
            })}
          </ul>
          {sectionOf && <p className="mt-2 text-[12px] text-[#98a2b3]">Prefer forms? Switch to <strong>Form</strong> at the top.</p>}
        </div>
      </>
    );
  }

  const width = DEVICES.find((d) => d.id === device)!.width;
  const scale = box.w ? Math.min(1, (box.w - 16) / width) : 1;

  return (
    <div className="grid h-[calc(100dvh-190px)] min-h-[560px] grid-cols-[minmax(0,1fr)_400px] gap-4">
      {/* Live page */}
      <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#eaecf0] bg-[#e4e7ec]">
        <div className="flex items-center justify-between gap-3 border-b border-[#eaecf0] bg-white px-3 py-2">
          <div className="flex gap-1" role="group" aria-label="Screen size">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={device === d.id}
                onClick={() => setDevice(d.id)}
                className={`rounded-md px-3 py-1.5 text-[13px] font-medium ${device === d.id ? "bg-[#1a2d59] text-white" : "text-[#475467] hover:bg-[#f2f4f7]"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[12px] text-[#667085]">
            {loading ? <span>Loading the page…</span> : <span>Showing your draft{scale < 1 ? ` · ${Math.round(scale * 100)}%` : ""}</span>}
            <button type="button" onClick={reload} className="font-medium text-[#1a2d59] hover:underline">Refresh</button>
          </div>
        </div>
        <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute top-0" style={{ width: width * scale, height: "100%", left: `max(8px, calc(50% - ${(width * scale) / 2}px))` }}>
            <iframe
              ref={frame}
              src={src}
              title={`${page.title} (editable preview)`}
              style={{ width, height: box.h ? box.h / scale : "100%", transform: `scale(${scale})`, transformOrigin: "0 0" }}
              className="border-0 bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Editing panel */}
      <aside aria-label="Edit the selected part" className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
        {panel}
      </aside>
    </div>
  );
}

function PanelTitle({ eyebrow, title, description, onBack }: { eyebrow: string; title: string; description?: string; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={onBack} className="w-fit text-[12px] font-medium text-[#475467] hover:text-[#101828]">← Back</button>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">{eyebrow}</p>
      <h2 className="text-[17px] font-semibold text-[#101828]">{title}</h2>
      {description && <p className="text-[13px] text-[#667085]">{description}</p>}
    </div>
  );
}

