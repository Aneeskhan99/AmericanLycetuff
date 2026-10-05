"use client";

import { useId, useState } from "react";
import type { Field, ImageValue, LinkValue, ScalarField } from "@/lib/content";
import MediaPicker from "../MediaPicker";
import { Button, ConfirmDialog, Input, Textarea } from "../ui";
import { blankItem, itemTitle, summary, TEXT_MAX_DEFAULT } from "./patch";

type ListFieldT = Extract<Field, { type: "list" }>;

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ------------------------------------------------------------------ small bits
export function ChangedDot({ title = "Changed since the last publish" }: { title?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#b54708]" title={title}>
      <span className="inline-block size-2 rounded-full bg-[#f79009]" aria-hidden />
      <span className="sr-only">{title}</span>
    </span>
  );
}

function Counter({ len, max }: { len: number; max: number }) {
  if (len < max * 0.8) return null;
  return <span className={cx("text-[12px] tabular-nums", len > max ? "font-medium text-[#b42318]" : "text-[#667085]")}>{len}/{max}</span>;
}

const TEXT_TIP = (
  <>
    Tip: <code className="rounded bg-[#f2f4f7] px-1">*words*</code> show in <span className="font-medium text-[#d31245]">crimson</span>
  </>
);
const TEXTAREA_TIP = (
  <>
    {TEXT_TIP} · a new line = a line break
  </>
);

/** Preview of a value (used for "Default:" expanders). */
export function ValuePreview({ field, value }: { field: Field; value: unknown }) {
  if (field.type === "image") {
    const v = value as ImageValue;
    return (
      <span className="flex items-center gap-3">
        {v.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.src} alt="" className="h-14 w-20 shrink-0 rounded border border-[#eaecf0] object-cover" />
        ) : (
          <span className="text-[#98a2b3]">No image</span>
        )}
        <span className="text-[12px] text-[#667085]">{v.alt ? `Alt text: ${v.alt}` : "No alt text"}</span>
      </span>
    );
  }
  if (field.type === "list") {
    const items = value as Record<string, unknown>[];
    return (
      <ol className="list-decimal pl-5">
        {items.map((it, i) => <li key={i}>{itemTitle(field, it, i)}</li>)}
        {!items.length && <li className="list-none text-[#98a2b3]">No items</li>}
      </ol>
    );
  }
  const s = summary(field, value);
  return <span className="whitespace-pre-wrap break-words">{s || <span className="text-[#98a2b3]">(empty)</span>}</span>;
}

// ------------------------------------------------------------------ scalar editors
export function ScalarInput({ field, value, onChange, idBase, inList }: {
  field: ScalarField; value: unknown; onChange: (v: unknown) => void; idBase: string; inList?: boolean;
}) {
  switch (field.type) {
    case "text":
    case "textarea":
      return <TextInput field={field} value={String(value ?? "")} onChange={onChange} id={idBase} />;
    case "link":
      return <LinkInput value={(value as LinkValue) ?? { label: "", href: "" }} onChange={onChange} idBase={idBase} />;
    case "image":
      return <ImageEditor field={field} value={(value as ImageValue) ?? { src: "", alt: "" }} onChange={onChange} idBase={idBase} inList={inList} />;
  }
}

function TextInput({ field, value, onChange, id }: {
  field: Extract<ScalarField, { type: "text" | "textarea" }>; value: string; onChange: (v: string) => void; id: string;
}) {
  const max = field.max ?? TEXT_MAX_DEFAULT;
  // A one-line field becomes a small text box when it needs a line break (e.g. a two-line heading).
  const multi = field.type === "textarea" || value.includes("\n") || field.default.includes("\n");
  const rows = field.type === "textarea" ? field.rows ?? Math.min(10, Math.max(3, Math.ceil(value.length / 90) + 1)) : Math.max(2, value.split("\n").length);
  return (
    <div className="flex flex-col gap-1">
      {multi ? (
        <Textarea id={id} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className={cx(field.type === "text" && "min-h-0")} aria-invalid={value.length > max} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={value.length > max} />
      )}
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] text-[#667085]">{field.hint?.includes("*word") ? null : multi ? TEXTAREA_TIP : TEXT_TIP}</p>
        <Counter len={value.length} max={max} />
      </div>
    </div>
  );
}

function LinkInput({ value, onChange, idBase }: { value: LinkValue; onChange: (v: LinkValue) => void; idBase: string }) {
  const bad = value.href.trim() !== "" && !/^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value.href.trim());
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idBase}-label`} className="text-[12px] font-medium text-[#475467]">Button / link text</label>
        <Input id={`${idBase}-label`} value={value.label} onChange={(e) => onChange({ ...value, label: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idBase}-href`} className="text-[12px] font-medium text-[#475467]">Goes to</label>
        <Input
          id={`${idBase}-href`}
          value={value.href}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
          placeholder="/admissions or https://…"
          spellCheck={false}
          autoCapitalize="none"
          aria-invalid={bad}
          className="font-mono text-[13px]"
        />
        <p className={cx("text-[12px]", bad ? "text-[#b42318]" : "text-[#667085]")}>
          {bad ? "Start with / for a page on this site, or https://, mailto: or tel:" : "A page on this site starts with /, e.g. /contact"}
        </p>
      </div>
    </div>
  );
}

function ImageEditor({ field, value, onChange, idBase, inList }: {
  field: Extract<ScalarField, { type: "image" }>; value: ImageValue; onChange: (v: ImageValue) => void; idBase: string; inList?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isDefault = value.src === field.default.src && value.alt === field.default.alt && !value.mediaId;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#eaecf0] bg-[#f9fafb] sm:w-48">
        {value.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.src} alt={value.alt} className="size-full object-cover" />
        ) : (
          <span className="text-[12px] text-[#98a2b3]">No image</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button type="button" tone="secondary" size="sm" onClick={() => setOpen(true)}>{value.src ? "Replace image" : "Choose image"}</Button>
          {!inList && !isDefault && (
            <Button type="button" tone="ghost" size="sm" onClick={() => onChange(structuredClone(field.default))}>Use default image</Button>
          )}
        </div>
        <label htmlFor={`${idBase}-alt`} className="text-[12px] font-medium text-[#475467]">Alt text</label>
        <Input id={`${idBase}-alt`} value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} placeholder="Describe the picture" />
        <p className="text-[12px] text-[#667085]">Describe what the picture shows, for visitors using screen readers and for search engines.</p>
      </div>
      {open && (
        <MediaPicker
          open
          kind="image"
          onClose={() => setOpen(false)}
          onPick={([m]) => {
            setOpen(false);
            if (m) onChange({ src: m.url, alt: m.alt || value.alt, mediaId: m.id });
          }}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ list editor
let seq = 0;
const nextId = () => ++seq;

export function ListEditor({ field, value, onChange, idBase }: {
  field: ListFieldT; value: Record<string, unknown>[]; onChange: (v: Record<string, unknown>[]) => void; idBase: string;
}) {
  const [ids, setIds] = useState<number[]>(() => value.map(nextId));
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const [removing, setRemoving] = useState<number | null>(null);
  // The list can change from outside (reset, restore): give it fresh ids.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    if (value.length !== ids.length) setIds(value.map(nextId));
  }

  const max = field.max, min = field.min ?? 0;
  const canAdd = max === undefined || value.length < max;
  const canRemove = value.length > min;

  const setItem = (i: number, k: string, v: unknown) => onChange(value.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const nv = [...value], ni = [...ids];
    [nv[i], nv[j]] = [nv[j], nv[i]];
    [ni[i], ni[j]] = [ni[j], ni[i]];
    setIds(ni);
    setSeen(nv);
    onChange(nv);
  };
  const add = () => {
    const id = nextId();
    const nv = [...value, blankItem(field)];
    setIds([...ids, id]);
    setSeen(nv);
    setOpen(new Set(open).add(id));
    onChange(nv);
  };
  const remove = (i: number) => {
    const nv = value.filter((_, j) => j !== i);
    setIds(ids.filter((_, j) => j !== i));
    setSeen(nv);
    onChange(nv);
  };
  const toggle = (id: number) => {
    const n = new Set(open);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setOpen(n);
  };
  const allOpen = ids.length > 0 && ids.every((id) => open.has(id));

  return (
    <div className="flex flex-col gap-2">
      {value.length > 1 && (
        <div className="flex justify-end">
          <button type="button" className="text-[12px] font-medium text-[#1a2d59] hover:underline" onClick={() => setOpen(allOpen ? new Set() : new Set(ids))}>
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>
      )}
      <ol className="flex flex-col gap-2">
        {value.map((item, i) => {
          const id = ids[i] ?? -i;
          const expanded = open.has(id);
          const title = itemTitle(field, item, i);
          return (
            <li key={id} className="rounded-lg border border-[#eaecf0] bg-[#fcfcfd]">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  aria-expanded={expanded}
                  aria-controls={`${idBase}-item-${id}`}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1.5 text-left hover:bg-[#f2f4f7]"
                >
                  <svg className={cx("size-4 shrink-0 text-[#667085] transition-transform", expanded && "rotate-90")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
                  <span className="shrink-0 text-[12px] tabular-nums text-[#98a2b3]">{i + 1}.</span>
                  <span className="truncate text-[14px] font-medium text-[#101828]">{title}</span>
                </button>
                <IconBtn label={`Move "${title}" up`} disabled={i === 0} onClick={() => move(i, -1)} d="M12 19V5M5 12l7-7 7 7" />
                <IconBtn label={`Move "${title}" down`} disabled={i === value.length - 1} onClick={() => move(i, 1)} d="M12 5v14M5 12l7 7 7-7" />
                <IconBtn label={`Remove "${title}"`} disabled={!canRemove} onClick={() => setRemoving(i)} d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" danger />
              </div>
              {expanded && (
                <div id={`${idBase}-item-${id}`} className="flex flex-col gap-4 border-t border-[#eaecf0] px-4 py-4">
                  {Object.entries(field.item).map(([k, sub]) => (
                    <div key={k} className="flex flex-col gap-1.5">
                      {sub.type === "link" || sub.type === "image" ? (
                        <span className="text-[13px] font-medium text-[#344054]">{sub.label}</span>
                      ) : (
                        <label htmlFor={`${idBase}-${id}-${k}`} className="text-[13px] font-medium text-[#344054]">{sub.label}</label>
                      )}
                      {sub.hint && <p className="-mt-1 text-[12px] text-[#667085]">{sub.hint}</p>}
                      <ScalarInput field={sub} value={item[k]} onChange={(v) => setItem(i, k, v)} idBase={`${idBase}-${id}-${k}`} inList />
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {!value.length && <p className="rounded-lg border border-dashed border-[#d0d5dd] px-4 py-6 text-center text-[13px] text-[#667085]">No items yet.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" tone="secondary" size="sm" onClick={add} disabled={!canAdd}>+ Add item</Button>
        <span className="text-[12px] text-[#667085]">
          {value.length} item{value.length === 1 ? "" : "s"}
          {max !== undefined && ` (max ${max})`}
          {min > 0 && ` · at least ${min}`}
        </span>
      </div>
      <ConfirmDialog
        open={removing !== null}
        title="Remove this item?"
        message={<>“{removing !== null && value[removing] ? itemTitle(field, value[removing], removing) : ""}” will be removed from the list. You can undo this with “Reset to default” or by discarding the draft.</>}
        confirmLabel="Remove"
        onConfirm={() => { if (removing !== null) remove(removing); setRemoving(null); }}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}

function IconBtn({ label, d, onClick, disabled, danger }: { label: string; d: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx("flex size-8 shrink-0 items-center justify-center rounded-md text-[#475467] hover:bg-[#f2f4f7] disabled:cursor-not-allowed disabled:opacity-35", danger && "hover:bg-[#fef3f2] hover:text-[#b42318]")}
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
    </button>
  );
}

// ------------------------------------------------------------------ one field
export function FieldBlock({ path, field, value, isCustom, changed, onChange, onReset }: {
  path: string; field: Field; value: unknown; isCustom: boolean; changed: boolean;
  onChange: (v: unknown) => void; onReset: () => void;
}) {
  const uid = useId();
  const idBase = `f-${path.replace(/\./g, "-")}-${uid.replace(/:/g, "")}`;
  const [showDefault, setShowDefault] = useState(false);
  const labelFor = field.type === "text" || field.type === "textarea" ? idBase : undefined;
  return (
    <section id={`field-${path}`} className="scroll-mt-40 rounded-xl border border-[#eaecf0] bg-white p-4 sm:p-5" aria-label={field.label}>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {labelFor ? (
              <label htmlFor={labelFor} className="text-[14px] font-semibold text-[#101828]">{field.label}</label>
            ) : (
              <span className="text-[14px] font-semibold text-[#101828]">{field.label}</span>
            )}
            {changed && <ChangedDot />}
            {isCustom && <span className="rounded bg-[#eff4ff] px-1.5 py-0.5 text-[11px] font-medium text-[#1a2d59]">Edited</span>}
          </div>
          {field.hint && <p className="mt-0.5 text-[12px] text-[#667085]">{field.hint}</p>}
        </div>
        {isCustom && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowDefault((s) => !s)}
              aria-expanded={showDefault}
              className="rounded px-2 py-1 text-[12px] text-[#475467] hover:bg-[#f2f4f7]"
            >
              {showDefault ? "Hide default" : "Show default"}
            </button>
            <Button type="button" tone="ghost" size="sm" onClick={onReset} className="text-[#1a2d59]" title="Put this back to the original website text">
              Reset to default
            </Button>
          </div>
        )}
      </div>
      {isCustom && showDefault && (
        <div className="mb-3 rounded-md border border-dashed border-[#d0d5dd] bg-[#f9fafb] px-3 py-2 text-[13px] text-[#475467]">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">Default (original website text)</span>
          <ValuePreview field={field} value={field.default} />
        </div>
      )}
      {field.type === "list" ? (
        <ListEditor field={field} value={value as Record<string, unknown>[]} onChange={onChange} idBase={idBase} />
      ) : (
        <ScalarInput field={field} value={value} onChange={onChange} idBase={idBase} />
      )}
    </section>
  );
}

