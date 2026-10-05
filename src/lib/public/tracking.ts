/**
 * Where a visitor came from, for the website forms (browser only).
 *
 * captureLanding() runs on every page (the footer newsletter form calls it on
 * mount): on the first page of a visit it keeps the external referrer, the
 * landing page and any UTM tags in sessionStorage. A later page opened with new
 * UTM tags (a second campaign click) replaces them. The forms then send
 * trackingPayload() with each submission.
 *
 * sessionStorage can be missing or throw (private mode, blocked storage), so
 * every access is wrapped and the forms still work without it.
 */
import { UTM_KEYS, type UtmKey } from "@/lib/enquiry-options";

const KEY = "als_landing";

type Landing = { referrer: string; landingPage: string } & Partial<Record<UtmKey, string>>;

export type TrackingPayload = {
  sourcePage: string;
  referrer: string;
  landingPage: string;
} & Record<UtmKey, string>;

function read(): Landing | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Landing) : null;
  } catch {
    return null;
  }
}

function write(v: Landing) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable: the forms fall back to the current page */
  }
}

/** The referrer only when it is another site (internal page-to-page clicks say nothing about the source). */
function externalReferrer(): string {
  const r = document.referrer;
  if (!r) return "";
  try {
    return new URL(r).host === window.location.host ? "" : r.slice(0, 500);
  } catch {
    return "";
  }
}

function utmsFromUrl(): Partial<Record<UtmKey, string>> {
  const p = new URLSearchParams(window.location.search);
  const out: Partial<Record<UtmKey, string>> = {};
  for (const k of UTM_KEYS) {
    const v = p.get(k)?.trim();
    if (v) out[k] = v.slice(0, 200);
  }
  return out;
}

/** Records the landing source once per visit (or again when the URL carries new UTM tags). */
export function captureLanding() {
  if (typeof window === "undefined") return;
  const utms = utmsFromUrl();
  const hasUtm = Object.keys(utms).length > 0;
  if (!hasUtm && read()) return;
  write({ referrer: externalReferrer(), landingPage: (window.location.pathname + window.location.search).slice(0, 300), ...utms });
}

/** Source details sent with a form submission. */
export function trackingPayload(): TrackingPayload {
  captureLanding();
  const l = read();
  const now = utmsFromUrl();
  const utm = {} as Record<UtmKey, string>;
  for (const k of UTM_KEYS) utm[k] = now[k] || l?.[k] || "";
  return {
    sourcePage: window.location.pathname.slice(0, 300),
    referrer: l?.referrer || externalReferrer() || document.referrer.slice(0, 500),
    landingPage: l?.landingPage || "",
    ...utm,
  };
}
