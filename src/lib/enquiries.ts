import "server-only";
import { createHash } from "node:crypto";
import { HttpError } from "@/lib/admin-route";
import { one, q } from "@/lib/db";
import { bool, email, int, str } from "@/lib/validate";
import { esc, sendMail, siteUrl, type MailResult } from "@/lib/mail";
import { FORM_LABEL, GRADES, ENQUIRY_FORMS, ENQUIRY_STATUSES, STATUS_LABEL, type EnquiryForm, type EnquiryStatus } from "@/lib/enquiry-options";

/**
 * Server helpers shared by the public form endpoints (/api/enquiry, /api/subscribe)
 * and the admin Enquiries / Subscribers screens: request checks, rate limiting,
 * notification emails, list filters and CSV output.
 */

// ------------------------------------------------------------------ public request checks
export function requestIp(req: Request): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local").slice(0, 64);
}

/** A salted hash of the IP: enough to rate-limit, without keeping the address. */
export function ipHash(ip: string): string {
  return createHash("sha256").update(`${process.env.ADMIN_SESSION_SECRET ?? "als"}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * The form must be posted from this site: the Origin (or, failing that, the
 * Referer) has to match the host. Requests with neither are refused.
 */
export function sameOrigin(req: Request): boolean {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const from = req.headers.get("origin") || req.headers.get("referer");
  if (!host || !from || from === "null") return false;
  try {
    return new URL(from).host === host;
  } catch {
    return false;
  }
}

/** Simple in-memory limiter (per server process) for endpoints without their own table. */
const buckets = new Map<string, number[]>();
export function memoryLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return false;
}

// ------------------------------------------------------------------ campuses
export type CampusRow = { id: number; name: string };

/** The first active campus (by order), used when a form does not choose one. */
export async function defaultCampusId(): Promise<number | null> {
  const row = await one<{ id: string }>(`SELECT id FROM campuses WHERE active ORDER BY sort, id LIMIT 1`);
  return row ? Number(row.id) : null;
}

// ------------------------------------------------------------------ emails
export type EnquiryRecord = {
  id: number | string;
  form: EnquiryForm;
  status: EnquiryStatus;
  name: string;
  phone: string;
  email: string;
  child_name: string;
  grade: string;
  topic: string;
  message: string;
  data: Record<string, unknown>;
  campus_name?: string | null;
  source_page: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  created_at: string | Date;
};

export const enquiryLink = (id: number | string) => `${siteUrl()}/admin/enquiries/${id}`;

function fmtWhen(v: string | Date) {
  return new Date(v).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi",
  });
}

/** Label/value pairs of what the visitor submitted, in reading order (empty values dropped). */
export function enquiryFields(e: EnquiryRecord): [string, string][] {
  const d = (k: string) => (typeof e.data?.[k] === "string" ? (e.data[k] as string) : "");
  const rows: [string, string][] = [
    ["Form", FORM_LABEL[e.form] ?? e.form],
    ["Received", fmtWhen(e.created_at)],
    [e.form === "contact" ? "Name" : "Parent / guardian", e.name],
    ["Phone", e.phone],
    ["Email", e.email],
    ["Preferred contact time", d("preferredContactTime")],
    ["Child's name", e.child_name],
    ["Grade applying for", e.grade],
    ["Pathway of interest", d("pathway")],
    ["Campus visit requested", e.form === "contact" ? "" : d("campusVisit") || (e.form === "visit" ? "Yes" : "")],
    ["Enquiring about", e.topic],
    ["Campus", e.campus_name ?? ""],
    ["Message", e.message],
  ];
  return rows.filter(([, v]) => v);
}

export function sourceFields(e: EnquiryRecord): [string, string][] {
  const landing = typeof e.data?.landingPage === "string" ? (e.data.landingPage as string) : "";
  const rows: [string, string][] = [
    ["Page", e.source_page],
    ["Landing page", landing],
    ["Referrer", e.referrer],
    ["UTM source", e.utm_source],
    ["UTM medium", e.utm_medium],
    ["UTM campaign", e.utm_campaign],
    ["UTM term", e.utm_term],
    ["UTM content", e.utm_content],
  ];
  return rows.filter(([, v]) => v);
}

function summary(e: EnquiryRecord, intro: string) {
  const fields = enquiryFields(e);
  const source = sourceFields(e);
  const link = enquiryLink(e.id);
  const text = [
    intro,
    "",
    ...fields.map(([k, v]) => `${k}: ${v}`),
    "",
    "Source",
    ...(source.length ? source.map(([k, v]) => `${k}: ${v}`) : ["Direct / unknown"]),
    "",
    `Open in the admin: ${link}`,
  ].join("\n");

  const row = ([k, v]: [string, string]) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#667085;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#101828;white-space:pre-wrap">${esc(v)}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5">
<div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #eaecf0;border-radius:8px;overflow:hidden">
<div style="background:#1a2d59;color:#fff;padding:16px 20px;font-size:16px;font-weight:bold">${esc(intro)}</div>
<div style="padding:16px 20px">
<table style="border-collapse:collapse;width:100%">${fields.map(row).join("")}</table>
<p style="margin:20px 0 6px;font-weight:bold;color:#d31245;text-transform:uppercase;font-size:12px;letter-spacing:1px">Source</p>
<table style="border-collapse:collapse;width:100%">${source.length ? source.map(row).join("") : row(["Source", "Direct / unknown"])}</table>
<p style="margin:24px 0 4px"><a href="${esc(link)}" style="display:inline-block;background:#d31245;color:#fff;text-decoration:none;padding:10px 18px;border-radius:4px;font-weight:bold">Open in the admin</a></p>
</div></div></body></html>`;
  return { text, html };
}

const SUBJECT: Record<EnquiryForm, (n: string) => string> = {
  enquire: (n) => `New admission enquiry from ${n}`,
  visit: (n) => `Campus visit request from ${n}`,
  contact: (n) => `New contact message from ${n}`,
};

/** Emails the school (settings.notifications[form]) about a new submission. */
export async function notifySchool(e: EnquiryRecord, to: string[]): Promise<MailResult> {
  if (!to.length) return "skipped (no SMTP)";
  const { text, html } = summary(e, `${FORM_LABEL[e.form]} from the website`);
  return sendMail({ to, subject: SUBJECT[e.form](e.name), text, html, replyTo: e.email || undefined });
}

/** Emails a staff member that an enquiry has been assigned to them. */
export async function notifyAssignee(e: EnquiryRecord, to: string, assignedBy: string): Promise<MailResult> {
  const { text, html } = summary(e, `${assignedBy} assigned you an enquiry: ${e.name}`);
  return sendMail({ to, subject: `Assigned to you: ${FORM_LABEL[e.form].toLowerCase()} from ${e.name}`, text, html, replyTo: e.email || undefined });
}

/** Loads one enquiry with its campus name, for emails and the detail screen. */
export async function loadEnquiry(id: number) {
  return one<EnquiryRecord & {
    campus_id: string | null; assigned_to: string | null; assigned_name: string | null; read_at: string | null;
    email_status: string; updated_at: string;
  }>(
    `SELECT e.id, e.form, e.status, e.campus_id, c.name AS campus_name, e.name, e.phone, e.email, e.child_name, e.grade,
            e.topic, e.message, e.data, e.assigned_to, u.name AS assigned_name, e.read_at, e.source_page, e.referrer,
            e.utm_source, e.utm_medium, e.utm_campaign, e.utm_term, e.utm_content, e.email_status, e.created_at, e.updated_at
       FROM enquiries e
       LEFT JOIN campuses c ON c.id = e.campus_id
       LEFT JOIN users u ON u.id = e.assigned_to
      WHERE e.id = $1`,
    [id],
  );
}

// ------------------------------------------------------------------ admin list filter
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const likeEscape = (s: string) => `%${s.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;

/**
 * Builds the WHERE clause for the enquiry list and its CSV export from the query
 * string (search, form, campus, grade, status, assigned, from, to). Every value
 * becomes a $n parameter.
 */
export function enquiryFilter(sp: URLSearchParams, opts: { skipStatus?: boolean } = {}) {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: (n: string) => string, v: unknown) => {
    params.push(v);
    where.push(sql(`$${params.length}`));
  };

  const search = (sp.get("search") ?? "").trim().slice(0, 80);
  if (search) {
    const digits = search.replace(/\D/g, "");
    params.push(likeEscape(search));
    const p = `$${params.length}`;
    let phone = "";
    if (digits.length >= 3) {
      params.push(likeEscape(digits));
      phone = ` OR regexp_replace(e.phone, '\\D', '', 'g') LIKE $${params.length}`;
    }
    where.push(`(e.name ILIKE ${p} OR e.phone ILIKE ${p} OR e.email ILIKE ${p} OR e.child_name ILIKE ${p}${phone})`);
  }
  const form = sp.get("form") ?? "";
  if ((ENQUIRY_FORMS as readonly string[]).includes(form)) add((n) => `e.form = ${n}`, form);

  const campus = sp.get("campus") ?? "";
  if (campus === "none") where.push("e.campus_id IS NULL");
  else if (/^\d{1,12}$/.test(campus)) add((n) => `e.campus_id = ${n}`, Number(campus));

  const grade = sp.get("grade") ?? "";
  if (grade === "none") where.push("e.grade = ''");
  else if ((GRADES as readonly string[]).includes(grade)) add((n) => `e.grade = ${n}`, grade);

  const status = sp.get("status") ?? "";
  if (!opts.skipStatus && (ENQUIRY_STATUSES as readonly string[]).includes(status)) add((n) => `e.status = ${n}`, status);

  const assigned = sp.get("assigned") ?? "";
  if (assigned === "none") where.push("e.assigned_to IS NULL");
  else if (/^\d{1,12}$/.test(assigned)) add((n) => `e.assigned_to = ${n}`, Number(assigned));

  const unread = sp.get("unread") === "1";
  if (unread) where.push("e.read_at IS NULL");

  const from = sp.get("from") ?? "";
  if (DATE_RE.test(from) && !Number.isNaN(Date.parse(from))) add((n) => `e.created_at >= (${n}::date)::timestamp AT TIME ZONE 'Asia/Karachi'`, from);
  const to = sp.get("to") ?? "";
  if (DATE_RE.test(to) && !Number.isNaN(Date.parse(to))) add((n) => `e.created_at < ((${n}::date + 1))::timestamp AT TIME ZONE 'Asia/Karachi'`, to);

  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

// ------------------------------------------------------------------ CSV
/** One CSV cell: quoted, quotes doubled, and formula-looking values neutralised with a leading '. */
export function csvCell(v: unknown): string {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function csvResponse(filename: string, header: string[], rows: unknown[][]): Response {
  const lines = [header, ...rows].map((r) => r.map(csvCell).join(","));
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const csvDate = (v: string | Date | null) =>
  v ? new Date(v).toLocaleString("sv-SE", { timeZone: "Asia/Karachi" }).slice(0, 16) : "";

export { FORM_LABEL, STATUS_LABEL };

/** Recent submissions from this IP hash (for the public rate limit). */
export async function recentFromIp(hash: string, minutes: number): Promise<number> {
  const row = await one<{ n: number }>(
    `SELECT count(*)::int AS n FROM enquiries WHERE ip_hash = $1 AND created_at > now() - make_interval(mins => $2)`,
    [hash, minutes],
  );
  return row?.n ?? 0;
}

export async function activeStaff() {
  return q<{ id: string; name: string; email: string; role: string }>(
    `SELECT id, name, email, role FROM users WHERE NOT disabled AND role IN ('administrator', 'editor') ORDER BY lower(name)`,
  );
}

/** WHERE clause for the subscriber list and its CSV export (search, status). */
export function subscriberFilter(sp: URLSearchParams) {
  const where: string[] = [];
  const params: unknown[] = [];
  const search = (sp.get("search") ?? "").trim().slice(0, 120);
  if (search) {
    params.push(`%${search.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
    where.push(`(email ILIKE $${params.length} OR name ILIKE $${params.length})`);
  }
  const status = sp.get("status") ?? "";
  if (status === "subscribed" || status === "unsubscribed") {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

/** Shared validation for campus create/update. */
export function campusInput(b: Record<string, unknown>) {
  const name = str(b.name, { required: true, max: 120, label: "Campus name" });
  const phone = str(b.phone, { max: 40, label: "Phone" });
  if (phone && !/^[+\d\s()-]+$/.test(phone)) throw new HttpError(422, "Phone may only contain digits, spaces, +, - and brackets.");
  const mapUrl = str(b.mapUrl, { max: 1000, label: "Map link" });
  if (mapUrl) {
    try {
      const u = new URL(mapUrl);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch {
      throw new HttpError(422, "Map link must be a full web address starting with https://");
    }
  }
  return {
    name,
    address: str(b.address, { max: 300, label: "Address" }),
    phone,
    email: email(b.email, { label: "Email" }),
    mapUrl,
    active: b.active === undefined ? true : bool(b.active),
    sort: int(b.sort, { min: 0, max: 9999, fallback: 0 }),
  };
}
