/**
 * Editable page content (Admin → Pages).
 *
 * Each page describes its editable fields in src/content/<page>.ts with
 * definePage(). The values written there are the CODE DEFAULTS. What the admin
 * changes is stored in page_content as a patch: { "<section>.<field>": value }.
 * getPageContent() merges the published patch (or, in Preview, the draft) over
 * the defaults, so any field nobody has touched keeps following the code.
 *
 * This file is shared by the server (pages) and the admin editor (client), so it
 * must not import anything server-only. The DB read lives in content-server.ts.
 */

// ------------------------------------------------------------------ field types
export type ImageValue = { src: string; alt: string; mediaId?: number | null };
export type LinkValue = { label: string; href: string };

type Base = { label: string; hint?: string };
export type TextField = Base & { type: "text"; default: string; max?: number };
export type TextareaField = Base & { type: "textarea"; default: string; max?: number; rows?: number };
export type LinkField = Base & { type: "link"; default: LinkValue };
export type ImageField = Base & { type: "image"; default: ImageValue };
export type ScalarField = TextField | TextareaField | LinkField | ImageField;
export type ListField<I extends Record<string, ScalarField> = Record<string, ScalarField>> = Base & {
  type: "list";
  item: I;
  default: { [K in keyof I]: FieldValue<I[K]> }[];
  /** Which item field to show as the item's title in the editor. */
  itemTitle?: keyof I & string;
  min?: number;
  max?: number;
};
export type Field = ScalarField | ListField;

export type FieldValue<F> = F extends TextField | TextareaField
  ? string
  : F extends LinkField
    ? LinkValue
    : F extends ImageField
      ? ImageValue
      : F extends ListField<infer I>
        ? { [K in keyof I]: FieldValue<I[K]> }[]
        : never;

export type Section = { label: string; description?: string; fields: Record<string, Field> };
export type PageDef<S extends Record<string, Section> = Record<string, Section>> = {
  key: string;
  title: string;
  /** Public path used for Preview. */
  path: string;
  /** Paths to revalidate when this page is published (defaults to [path]). Use "layout:/" for site-wide. */
  revalidate?: string[];
  sections: S;
};

export type PageContent<P extends PageDef> = {
  [S in keyof P["sections"]]: { [F in keyof P["sections"][S]["fields"]]: FieldValue<P["sections"][S]["fields"][F]> };
};

export type Patch = Record<string, unknown>;

// ------------------------------------------------------------------ builders
export const f = {
  text: (label: string, def: string, o: { hint?: string; max?: number } = {}): TextField => ({ type: "text", label, default: def, ...o }),
  textarea: (label: string, def: string, o: { hint?: string; max?: number; rows?: number } = {}): TextareaField => ({ type: "textarea", label, default: def, ...o }),
  link: (label: string, def: LinkValue, o: { hint?: string } = {}): LinkField => ({ type: "link", label, default: def, ...o }),
  image: (label: string, def: ImageValue, o: { hint?: string } = {}): ImageField => ({ type: "image", label, default: def, ...o }),
  list: <I extends Record<string, ScalarField>>(
    label: string,
    item: I,
    def: { [K in keyof I]: FieldValue<I[K]> }[],
    o: { hint?: string; itemTitle?: keyof I & string; min?: number; max?: number } = {},
  ): ListField<I> => ({ type: "list", label, item, default: def, ...o }),
};

export function definePage<S extends Record<string, Section>>(def: PageDef<S>): PageDef<S> {
  return def;
}

// ------------------------------------------------------------------ merge
export function defaultsOf<P extends PageDef>(page: P): PageContent<P> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const [sid, s] of Object.entries(page.sections)) {
    out[sid] = {};
    for (const [fid, field] of Object.entries(s.fields)) out[sid][fid] = structuredClone(field.default);
  }
  return out as PageContent<P>;
}

/** Applies a patch over the defaults. Unknown keys and wrongly-shaped values are ignored. */
export function applyPatch<P extends PageDef>(page: P, patch: Patch | null | undefined): PageContent<P> {
  const out = defaultsOf(page) as Record<string, Record<string, unknown>>;
  if (!patch) return out as PageContent<P>;
  for (const [path, value] of Object.entries(patch)) {
    const [sid, fid] = path.split(".");
    const field = page.sections[sid]?.fields[fid];
    if (!field || !validValue(field, value)) continue;
    out[sid][fid] = structuredClone(value);
  }
  return out as PageContent<P>;
}

export function validValue(field: Field, v: unknown): boolean {
  switch (field.type) {
    case "text":
    case "textarea":
      return typeof v === "string";
    case "link":
      return !!v && typeof v === "object" && typeof (v as LinkValue).label === "string" && typeof (v as LinkValue).href === "string";
    case "image":
      return !!v && typeof v === "object" && typeof (v as ImageValue).src === "string" && typeof (v as ImageValue).alt === "string";
    case "list":
      return Array.isArray(v) && v.every((item) => item && typeof item === "object" && Object.entries(field.item).every(([k, sub]) => validValue(sub, (item as Record<string, unknown>)[k])));
  }
}

/** Every media id referenced by a patch (for media usage tracking). */
export function mediaIdsIn(value: unknown): number[] {
  const ids: number[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      const m = (v as ImageValue).mediaId;
      if (typeof m === "number") ids.push(m);
      Object.values(v).forEach(walk);
    }
  };
  walk(value);
  return ids;
}

/** A link value is internal if it starts with "/" — handy for choosing <Link> vs <a>. */
export const isInternal = (href: string) => href.startsWith("/") && !href.startsWith("//");
