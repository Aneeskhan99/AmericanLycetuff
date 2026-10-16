import { after, NextResponse } from "next/server";
import { one, q } from "@/lib/db";
import { CONTACT_TIMES, CONTACT_TOPICS, GRADES, PATHWAYS, UTM_KEYS, type EnquiryForm } from "@/lib/enquiry-options";
import { defaultCampusId, ipHash, notifySchool, recentFromIp, requestIp, sameOrigin, type EnquiryRecord } from "@/lib/enquiries";
import { getSettings } from "@/lib/settings";

/**
 * POST /api/enquiry — the Contact Us (/contact) and Enquire Now (/enquire) forms.
 *
 * Saves every submission to the `enquiries` table (shown in Admin → Enquiries)
 * and emails the addresses set in Admin → Settings → Notifications for that form:
 *   form "contact"                       → notifications.contact
 *   form "enquire"                       → notifications.enquire
 *   form "enquire" with campusVisit=Yes  → stored as "visit", notifications.visit
 *
 * Protection: same-origin check, hidden honeypot field "website", 5 submissions
 * per IP per 10 minutes, and server-side validation of every field.
 * Response: { ok: true } or { ok: false, error } (shown by the form).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 5;
const WINDOW_MIN = 10;

class Invalid extends Error {}

const fail = (error: string, status = 422) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });

function text(v: unknown, label: string, { max, required = false, min = 0 }: { max: number; required?: boolean; min?: number }) {
  const s = typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim() : "";
  if (required && !s) throw new Invalid(`Please enter ${label}.`);
  if (s && s.length < min) throw new Invalid(`Please enter at least ${min} characters for ${label}.`);
  if (s.length > max) throw new Invalid(`Please keep ${label} to ${max} characters or fewer.`);
  // Control characters other than newlines/tabs are never legitimate.
  return s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

/** One-line value (no newlines). */
const line = (v: unknown, label: string, o: { max: number; required?: boolean; min?: number }) => text(v, label, o).replace(/\s+/g, " ");

function choice<T extends string>(v: unknown, allowed: readonly T[], label: string): T | "" {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return "";
  if (!allowed.includes(s as T)) throw new Invalid(`Please choose a valid ${label}.`);
  return s as T;
}

function phone(v: unknown) {
  const s = line(v, "your phone number", { max: 30, required: true });
  if (!/^[+\d\s()-]+$/.test(s)) throw new Invalid("Please use digits only for the phone number, e.g. 0300 1234567.");
  const digits = s.replace(/\D/g, "").length;
  if (digits < 10 || digits > 13) throw new Invalid("Please enter a valid phone number, e.g. 0300 1234567.");
  return s;
}

function emailAddr(v: unknown) {
  const s = line(v, "your email", { max: 254 });
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new Invalid("Please enter a valid email address, e.g. name@email.com.");
  return s.toLowerCase();
}

/** Accepts a path on this site ("/enquire") or an http(s) URL. */
function urlish(v: unknown, max: number) {
  const s = typeof v === "string" ? v.trim().slice(0, max) : "";
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? s : "";
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Please send the form from our website.", 403);

  let b: Record<string, unknown>;
  try {
    const raw = await req.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error();
    b = raw as Record<string, unknown>;
  } catch {
    return fail("Invalid request.", 400);
  }

  // Honeypot: real visitors never fill the hidden "website" field. Pretend it worked.
  if (typeof b.website === "string" && b.website.trim()) return NextResponse.json({ ok: true });

  const hash = ipHash(requestIp(req));
  try {
    if ((await recentFromIp(hash, WINDOW_MIN)) >= LIMIT) {
      return fail("You have sent several messages in the last few minutes. Please wait a little and try again, or call us.", 429);
    }
  } catch (err) {
    console.error("[enquiry] database unavailable", err);
    return fail("We could not send your message right now. Please call 0317-1173886.", 503);
  }

  let rec: {
    form: EnquiryForm; name: string; phone: string; email: string; child_name: string; grade: string;
    topic: string; message: string; data: Record<string, string>;
  };
  let src: { source_page: string; referrer: string } & Record<(typeof UTM_KEYS)[number], string>;
  try {
    const formIn = b.form;
    if (formIn !== "contact" && formIn !== "enquire" && formIn !== "visit") throw new Invalid("Invalid request.");
    const name = line(b.name, formIn === "contact" ? "your full name" : "the parent or guardian's name", { max: 120, required: true, min: 2 });
    const ph = phone(b.phone);
    const em = emailAddr(b.email);

    if (formIn === "contact") {
      const topic = choice(b.topic, CONTACT_TOPICS, "topic") || "Other";
      const message = text(b.message, "your message", { max: 3000, required: true });
      rec = { form: "contact", name, phone: ph, email: em, child_name: "", grade: "", topic, message, data: { topic } };
    } else {
      const time = choice(b.preferredContactTime, CONTACT_TIMES, "contact time");
      const childName = line(b.childName, "your child's name", { max: 120 });
      const grade = choice(b.grade, GRADES, "grade");
      const pathway = choice(b.pathway, PATHWAYS, "pathway");
      const visit = formIn === "visit" || b.campusVisit === "Yes" || b.campusVisit === true;
      const message = text(b.message, "your message", { max: 3000 });
      const data: Record<string, string> = { campusVisit: visit ? "Yes" : "No" };
      if (time) data.preferredContactTime = time;
      if (pathway) data.pathway = pathway;
      rec = { form: visit ? "visit" : "enquire", name, phone: ph, email: em, child_name: childName, grade, topic: "", message, data };
    }

    const landing = urlish(b.landingPage, 300);
    if (landing) rec.data.landingPage = landing;
    src = {
      source_page: urlish(b.sourcePage, 300),
      referrer: urlish(b.referrer, 500),
      utm_source: "", utm_medium: "", utm_campaign: "", utm_term: "", utm_content: "",
    };
    for (const k of UTM_KEYS) src[k] = line(b[k], k, { max: 200 });
  } catch (err) {
    if (err instanceof Invalid) return fail(err.message);
    throw err;
  }

  let saved: EnquiryRecord;
  try {
    const campusId = await defaultCampusId();
    const ua = (req.headers.get("user-agent") ?? "").slice(0, 300);
    const row = await one<EnquiryRecord & { campus_name: string | null }>(
      `WITH ins AS (
         INSERT INTO enquiries (form, campus_id, name, phone, email, child_name, grade, topic, message, data,
                                source_page, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content, ip_hash, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         RETURNING *
       )
       SELECT ins.*, c.name AS campus_name FROM ins LEFT JOIN campuses c ON c.id = ins.campus_id`,
      [
        rec.form, campusId, rec.name, rec.phone, rec.email, rec.child_name, rec.grade, rec.topic, rec.message, JSON.stringify(rec.data),
        src.source_page, src.referrer, src.utm_source, src.utm_medium, src.utm_campaign, src.utm_term, src.utm_content, hash, ua,
      ],
    );
    if (!row) throw new Error("insert returned nothing");
    saved = row;
  } catch (err) {
    console.error("[enquiry] could not save", err);
    return fail("We could not send your message right now. Please call 0317-1173886.", 500);
  }

  // Email after the response, so a slow mail server never delays the visitor.
  const row = saved;
  after(async () => {
    try {
      const settings = await getSettings();
      const to = settings.notifications[row.form] ?? [];
      const status = to.length ? await notifySchool(row, to) : "skipped (no recipients)";
      await q(`UPDATE enquiries SET email_status = $2 WHERE id = $1`, [row.id, status]);
      await q(`INSERT INTO enquiry_activity (enquiry_id, kind, body, detail) VALUES ($1, 'email', $2, $3)`, [
        row.id,
        status === "sent" ? `Notification emailed to ${to.join(", ")}` : `Notification email ${status}`,
        JSON.stringify({ to, status }),
      ]);
    } catch (err) {
      console.error("[enquiry] notification failed", err);
    }
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
