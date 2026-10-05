import { body, guard, HttpError, json } from "@/lib/admin-route";
import { audit, q } from "@/lib/db";
import { mailConfigured } from "@/lib/mail";
import { revalidatePaths } from "@/lib/revalidate";
import { getSettings, saveSetting, SETTING_KEYS, type Settings } from "@/lib/settings";
import { bool, email, oneOf, str } from "@/lib/validate";

/**
 * GET /api/admin/settings — every settings group, plus mail status (never the SMTP credentials).
 * PUT /api/admin/settings  { key: <group>, value: {...} } — validates and saves one group.
 * Administrators only. Saving re-renders every public page (header/footer use settings).
 */

const obj = (v: unknown, label: string): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new HttpError(422, `${label}: invalid data.`);
  return v as Record<string, unknown>;
};

function httpUrl(v: unknown, label: string, max = 500): string {
  const s = str(v, { max, label });
  if (!s) return "";
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
  } catch {
    throw new HttpError(422, `${label} must be a full web address starting with https://`);
  }
  return s;
}

/** A link on this site ("/admissions") or a full https:// address. */
function link(v: unknown, label: string): string {
  const s = str(v, { max: 500, label });
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  return httpUrl(s, label);
}

function phoneText(v: unknown, label: string, required = false): string {
  const s = str(v, { max: 40, label, required });
  if (s && !/^[+\d\s()-]+$/.test(s)) throw new HttpError(422, `${label} may only contain digits, spaces, +, - and brackets.`);
  return s;
}

function emailList(v: unknown, label: string): string[] {
  const raw = Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split(/[\s,;]+/) : [];
  const list = [...new Set(raw.map((s) => s.trim().toLowerCase()).filter(Boolean))];
  if (list.length > 10) throw new HttpError(422, `${label}: at most 10 addresses.`);
  for (const a of list) {
    if (a.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)) throw new HttpError(422, `${label}: "${a.slice(0, 60)}" is not a valid email address.`);
  }
  return list;
}

function validate(key: keyof Settings, raw: unknown): Settings[keyof Settings] {
  const v = obj(raw, "Settings");
  switch (key) {
    case "school":
      return {
        name: str(v.name, { required: true, max: 120, label: "School name" }),
        campusName: str(v.campusName, { max: 120, label: "Campus name" }),
        tagline: str(v.tagline, { max: 160, label: "Tagline" }),
      };
    case "contact": {
      const phone = phoneText(v.phone, "Phone", true);
      let phoneHref = str(v.phoneHref, { max: 40, label: "Phone link" });
      if (!phoneHref) {
        const d = phone.replace(/\D/g, "");
        phoneHref = `tel:${d.startsWith("0") ? `+92${d.slice(1)}` : `+${d}`}`;
      }
      if (!/^tel:\+?\d{6,15}$/.test(phoneHref)) throw new HttpError(422, "Phone link must look like tel:+92938320011.");
      return {
        phone,
        phoneHref,
        phoneAlt: phoneText(v.phoneAlt, "Second phone"),
        whatsapp: phoneText(v.whatsapp, "WhatsApp number"),
        email: email(v.email, { required: true, label: "Email" }),
        admissionsEmail: email(v.admissionsEmail, { label: "Admissions email" }),
        address: str(v.address, { required: true, max: 300, label: "Address" }),
        mapUrl: httpUrl(v.mapUrl, "Map link", 1000),
      };
    }
    case "social": {
      const out = {} as Settings["social"];
      for (const k of ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok"] as const) {
        out[k] = httpUrl(v[k], k === "twitter" ? "X / Twitter link" : `${k[0].toUpperCase()}${k.slice(1)} link`);
      }
      return out;
    }
    case "hours":
      return {
        weekdays: str(v.weekdays, { max: 120, label: "Monday to Friday" }),
        saturday: str(v.saturday, { max: 120, label: "Saturday" }),
        sunday: str(v.sunday, { max: 120, label: "Sunday" }),
        note: str(v.note, { max: 400, label: "Note" }),
      };
    case "analytics": {
      const gaId = str(v.gaId, { max: 20, label: "Google Analytics ID" }).toUpperCase();
      const gtmId = str(v.gtmId, { max: 20, label: "Google Tag Manager ID" }).toUpperCase();
      if (gaId && !/^G-[A-Z0-9]{4,12}$/.test(gaId)) throw new HttpError(422, "Google Analytics ID must look like G-XXXXXXXXXX.");
      if (gtmId && !/^GTM-[A-Z0-9]{4,10}$/.test(gtmId)) throw new HttpError(422, "Google Tag Manager ID must look like GTM-XXXXXXX.");
      return { gaId, gtmId };
    }
    case "notifications":
      return {
        enquire: emailList(v.enquire, "Admission enquiries"),
        visit: emailList(v.visit, "Campus visit requests"),
        contact: emailList(v.contact, "Contact messages"),
        newsletter: emailList(v.newsletter, "Newsletter sign-ups"),
      };
    case "announcement": {
      const show = bool(v.show);
      const text = str(v.text, { max: 160, label: "Announcement text", required: show });
      return { show, text, href: link(v.href, "Announcement link") };
    }
  }
}

export const GET = guard(
  async () => {
    const settings = await getSettings();
    const updated = await q<{ key: string; updated_at: string; by_name: string | null }>(
      `SELECT s.key, s.updated_at, u.name AS by_name FROM settings s LEFT JOIN users u ON u.id = s.updated_by`,
    );
    return json({
      settings,
      updated: Object.fromEntries(updated.map((r) => [r.key, { at: r.updated_at, by: r.by_name }])),
      mail: { configured: mailConfigured(), from: mailConfigured() ? process.env.SMTP_FROM || process.env.SMTP_USER || "" : "" },
    });
  },
  { roles: ["administrator"] },
);

export const PUT = guard(
  async ({ session, req }) => {
    const b = await body(req);
    const key = oneOf(b.key, SETTING_KEYS, "Settings group");
    const value = validate(key, b.value);
    const before = (await getSettings())[key];
    await saveSetting(key, value as never, session.user.id);
    await audit(session.user.id, "setting", key, "update", { before, after: value });
    revalidatePaths(["layout:/"]);
    return json({ ok: true, value });
  },
  { roles: ["administrator"] },
);
