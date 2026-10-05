/**
 * Pure helpers for Admin → Pages, shared by the API routes (server) and the
 * editor (client). No server-only imports here.
 *
 * A page's stored content is a PATCH: { "<section>.<field>": value }. A key that
 * is missing means "use the code default"; values equal to the default are
 * never stored.
 */
import { validValue, type Field, type ImageValue, type LinkValue, type PageDef, type Patch, type ScalarField } from "@/lib/content";

export const TEXT_MAX_DEFAULT = 2000;
const LINK_MAX = 2000;

/** Structural equality for JSON-like values (key order does not matter). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const bb = b as unknown[];
    return a.length === bb.length && a.every((x, i) => deepEqual(x, bb[i]));
  }
  const ao = a as Record<string, unknown>, bo = b as Record<string, unknown>;
  // undefined-valued keys count as absent
  const ak = Object.keys(ao).filter((k) => ao[k] !== undefined);
  const bk = Object.keys(bo).filter((k) => bo[k] !== undefined);
  return ak.length === bk.length && ak.every((k) => deepEqual(ao[k], bo[k]));
}

/** The field definition for "section.field", or undefined. */
export function fieldAt(page: PageDef, path: string): Field | undefined {
  const [sid, fid, ...rest] = path.split(".");
  if (rest.length || !sid || !fid) return undefined;
  return Object.prototype.hasOwnProperty.call(page.sections, sid) && Object.prototype.hasOwnProperty.call(page.sections[sid].fields, fid)
    ? page.sections[sid].fields[fid]
    : undefined;
}

export function allPaths(page: PageDef): string[] {
  return Object.entries(page.sections).flatMap(([sid, s]) => Object.keys(s.fields).map((fid) => `${sid}.${fid}`));
}

export function fieldCount(page: PageDef) {
  return Object.values(page.sections).reduce((n, s) => n + Object.keys(s.fields).length, 0);
}

/** A copy of a value with only the keys the field knows about (drops anything extra). */
export function cleanValue(field: Field, v: unknown): unknown {
  switch (field.type) {
    case "text":
    case "textarea":
      return v;
    case "link": {
      const l = v as LinkValue;
      return { label: l.label, href: l.href };
    }
    case "image": {
      const i = v as ImageValue;
      const out: ImageValue = { src: i.src, alt: i.alt };
      if (typeof i.mediaId === "number" && Number.isInteger(i.mediaId) && i.mediaId > 0) out.mediaId = i.mediaId;
      return out;
    }
    case "list":
      return (v as Record<string, unknown>[]).map((item) =>
        Object.fromEntries(Object.entries(field.item).map(([k, sub]) => [k, cleanValue(sub, item[k])])),
      );
  }
}

const SAFE_HREF = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

/** A readable problem with a (valid-shaped) value, or null when it is fine. */
function problem(field: Field, v: unknown, label: string): string | null {
  switch (field.type) {
    case "text":
    case "textarea": {
      const max = field.max ?? TEXT_MAX_DEFAULT;
      return (v as string).length > max ? `${label} is too long (${(v as string).length} of ${max} characters).` : null;
    }
    case "link": {
      const l = v as LinkValue;
      if (l.label.length > 300) return `${label}: the button text is too long (max 300 characters).`;
      if (l.href.length > LINK_MAX) return `${label}: the link is too long.`;
      if (l.href.trim() && !SAFE_HREF.test(l.href.trim())) return `${label}: the link must start with / (a page on this site), https://, mailto: or tel:.`;
      return null;
    }
    case "image": {
      const i = v as ImageValue;
      if (i.src && (i.src.length > LINK_MAX || !((i.src.startsWith("/") && !i.src.startsWith("//")) || /^https:\/\//i.test(i.src)))) return `${label}: the image address is not valid.`;
      if (i.alt.length > 500) return `${label}: the alt text is too long (max 500 characters).`;
      return null;
    }
    case "list": {
      const items = v as Record<string, unknown>[];
      if (field.min !== undefined && items.length < field.min) return `${label} needs at least ${field.min} item${field.min === 1 ? "" : "s"}.`;
      if (field.max !== undefined && items.length > field.max) return `${label} can have at most ${field.max} items.`;
      for (let i = 0; i < items.length; i++) {
        for (const [k, sub] of Object.entries(field.item)) {
          const p = problem(sub, items[i][k], `${label}, item ${i + 1}, ${sub.label}`);
          if (p) return p;
        }
      }
      return null;
    }
  }
}

/**
 * Validates a whole patch against a page definition. Returns the cleaned patch
 * (defaults dropped) or throws an Error with a readable message.
 */
export function normalisePatch(page: PageDef, patch: unknown): Patch {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw new Error("The page content is missing.");
  const out: Patch = {};
  for (const [path, value] of Object.entries(patch as Record<string, unknown>)) {
    const field = fieldAt(page, path);
    if (!field) throw new Error(`Unknown field "${path}". Reload the page and try again.`);
    const label = labelOf(page, path);
    if (!validValue(field, value)) throw new Error(`${label} has a value of the wrong kind.`);
    const clean = cleanValue(field, value);
    const p = problem(field, clean, label);
    if (p) throw new Error(p);
    if (!deepEqual(clean, field.default)) out[path] = clean;
  }
  return out;
}

/**
 * Keeps only keys that still exist in the definition and hold a valid value
 * (stored patches can outlive a field that was renamed or removed in code).
 */
export function knownOnly(page: PageDef, patch: Patch | null | undefined): Patch {
  const out: Patch = {};
  if (!patch) return out;
  for (const [path, value] of Object.entries(patch)) {
    const field = fieldAt(page, path);
    if (field && validValue(field, value) && !deepEqual(value, field.default)) out[path] = value;
  }
  return out;
}

/** Field paths whose effective value differs between two patches. */
export function changedPaths(page: PageDef, a: Patch | null | undefined, b: Patch | null | undefined): string[] {
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  const order = allPaths(page);
  return [...keys]
    .filter((k) => !deepEqual((a ?? {})[k], (b ?? {})[k]))
    .sort((x, y) => {
      const ix = order.indexOf(x), iy = order.indexOf(y);
      return (ix < 0 ? 1e9 : ix) - (iy < 0 ? 1e9 : iy);
    });
}

/** "Hero › Title" for a field path (falls back to the raw path for removed fields). */
export function labelOf(page: PageDef, path: string): string {
  const [sid, fid] = path.split(".");
  const s = page.sections[sid];
  const f = s?.fields[fid];
  return s && f ? `${s.label} › ${f.label}` : path;
}

/** A short plain-text summary of a value (titles of list items, default previews). */
export function summary(field: ScalarField | Field, v: unknown): string {
  switch (field.type) {
    case "text":
    case "textarea":
      return String(v ?? "");
    case "link": {
      const l = v as LinkValue;
      return l ? `${l.label} → ${l.href}` : "";
    }
    case "image": {
      const i = v as ImageValue;
      return i ? i.alt || i.src : "";
    }
    case "list":
      return `${(v as unknown[]).length} item${(v as unknown[]).length === 1 ? "" : "s"}`;
  }
}

/** Title of a list item in the editor: the itemTitle field, else the first text field. */
export function itemTitle(field: Extract<Field, { type: "list" }>, item: Record<string, unknown>, index: number): string {
  const key = field.itemTitle ?? Object.keys(field.item).find((k) => field.item[k].type === "text" || field.item[k].type === "textarea");
  const sub = key ? field.item[key] : undefined;
  const raw = sub ? summary(sub, item[key!]) : "";
  const t = raw.replace(/\*([^*]+)\*/g, "$1").replace(/\s+/g, " ").trim();
  return t ? (t.length > 70 ? `${t.slice(0, 68)}…` : t) : `Item ${index + 1}`;
}

/** A fresh item for a list: every sub-field at its own default. */
export function blankItem(field: Extract<Field, { type: "list" }>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(field.item).map(([k, sub]) => [k, structuredClone(sub.default)]));
}
