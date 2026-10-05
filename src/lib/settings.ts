import "server-only";
import { q } from "@/lib/db";

/**
 * Site settings with code defaults. A row in the `settings` table overrides one
 * whole group (key). Public pages read these at build/revalidate time and fall
 * back to the defaults if the database is unavailable.
 */
export type Settings = {
  school: { name: string; campusName: string; tagline: string };
  contact: {
    phone: string; phoneHref: string; phoneAlt: string; whatsapp: string;
    email: string; admissionsEmail: string; address: string; mapUrl: string;
  };
  social: { facebook: string; instagram: string; twitter: string; linkedin: string; youtube: string; tiktok: string };
  hours: { weekdays: string; saturday: string; sunday: string; note: string };
  analytics: { gaId: string; gtmId: string };
  /** Who is emailed when each form is submitted. */
  notifications: { enquire: string[]; visit: string[]; contact: string[]; newsletter: string[] };
  /** Default text of the announcement bar when no notice is pinned. */
  announcement: { show: boolean; text: string; href: string };
};

export const DEFAULT_SETTINGS: Settings = {
  school: { name: "American Lycetuff", campusName: "Swabi Campus", tagline: "Learn, Grow & Shine" },
  contact: {
    phone: "0938-320011",
    phoneHref: "tel:+92938320011",
    phoneAlt: "",
    whatsapp: "",
    email: "info@alsswabi.edu.pk",
    admissionsEmail: "",
    address: "Sector-E, Shahmansoor Township Swabi, Khyber Pakhtunkhwa",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=American+Lycetuff+Swabi+Shahmansoor+Township",
  },
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    twitter: "https://twitter.com/",
    linkedin: "https://www.linkedin.com/",
    youtube: "",
    tiktok: "",
  },
  hours: {
    weekdays: "7:45 AM – 2:00 PM",
    saturday: "Mornings, for enquiries",
    sunday: "Closed",
    note: "Walk-ins are welcome during these hours. For a guided tour, we recommend booking ahead.",
  },
  analytics: { gaId: "", gtmId: "" },
  notifications: {
    enquire: ["info@alsswabi.edu.pk"],
    visit: ["info@alsswabi.edu.pk"],
    contact: ["info@alsswabi.edu.pk"],
    newsletter: [],
  },
  announcement: { show: true, text: "Applications open for 2026–27", href: "/admissions" },
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

/** All settings, DB values merged over defaults. Never throws. */
export async function getSettings(): Promise<Settings> {
  const out: Settings = structuredClone(DEFAULT_SETTINGS);
  try {
    const rows = await q<{ key: keyof Settings; value: unknown }>(`SELECT key, value FROM settings`);
    for (const r of rows) {
      if (!(r.key in out) || !r.value || typeof r.value !== "object") continue;
      Object.assign(out[r.key] as object, r.value);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[settings] using defaults:", (err as Error).message);
  }
  return out;
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K], userId: number) {
  await q(
    `INSERT INTO settings (key, value, updated_at, updated_by) VALUES ($1, $2, now(), $3)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`,
    [key, JSON.stringify(value), userId],
  );
}
