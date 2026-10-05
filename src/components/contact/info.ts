import "server-only";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";
import { directionsHref as defaultDirectionsHref } from "./ui";

/**
 * Contact details and opening hours for the Contact and Enquire pages, taken from
 * Admin → Settings. Where a setting is still empty (or still the untouched code
 * default that the page never showed) the page keeps its original placeholder,
 * so by default it looks exactly as designed.
 */
export type ContactInfo = {
  phone: string;
  phoneHref: string;
  /** Display text for WhatsApp (number or placeholder). */
  whatsapp: string;
  /** wa.me link when a number is set, otherwise the contact form anchor. */
  whatsappHref: string;
  whatsappExternal: boolean;
  /** Display text for the admissions email (address or placeholder). */
  admissionsEmail: string;
  emailHref: string;
  /** Full street address line (address or placeholder). */
  address: string;
  /** "Get directions" link. */
  directionsHref: string;
  hours: Settings["hours"];
  /** One-line hours summary used in the Enquire side panel. */
  hoursLine: string;
};

const PLACEHOLDER = {
  whatsapp: "[Number — to be added]",
  admissionsEmail: "[Admissions email — to be added]",
  address: "[Full street address — to be added]",
};

/** Value if the admin set one, else null (empty, or identical to the code default). */
const custom = (value: string, codeDefault: string) => {
  const v = value.trim();
  return v && v !== codeDefault ? v : null;
};

/** Pakistani numbers like 0300-1234567 → 923001234567 for wa.me links. */
export function waNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

export const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function contactInfo(s: Settings): ContactInfo {
  const c = s.contact;
  const d = DEFAULT_SETTINGS.contact;
  const whatsapp = c.whatsapp.trim();
  const admissions = c.admissionsEmail.trim();
  const address = custom(c.address, d.address);
  const mapUrl = custom(c.mapUrl, d.mapUrl);

  const h = s.hours;
  const dh = DEFAULT_SETTINGS.hours;
  // The Enquire panel was designed with its own short wording of the default hours.
  const hoursLine =
    h.weekdays === dh.weekdays && h.saturday === dh.saturday
      ? "Mon-Fri, 7:45 AM - 2:00 PM · Saturday mornings for enquiries"
      : [h.weekdays && `Mon-Fri, ${h.weekdays}`, h.saturday && `Saturday ${lcFirst(h.saturday)}`].filter(Boolean).join(" · ");

  return {
    phone: c.phone,
    phoneHref: c.phoneHref || `tel:${c.phone.replace(/[^\d+]/g, "")}`,
    whatsapp: whatsapp || PLACEHOLDER.whatsapp,
    whatsappHref: whatsapp ? `https://wa.me/${waNumber(whatsapp)}` : "#contact-form",
    whatsappExternal: !!whatsapp,
    admissionsEmail: admissions || PLACEHOLDER.admissionsEmail,
    emailHref: `mailto:${admissions || c.email}`,
    address: address ?? PLACEHOLDER.address,
    directionsHref: mapUrl ?? defaultDirectionsHref,
    hours: h,
    hoursLine,
  };
}
