"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Settings } from "@/lib/settings";
import { useAdmin } from "../AdminProvider";
import { Badge, Button, Card, Checkbox, ErrorNote, Field, fmtDate, Input, PageHeader, Textarea } from "../ui";
import CampusesCard from "./CampusesCard";

type Updated = Record<string, { at: string; by: string | null }>;
type SettingsRes = { settings: Settings; updated: Updated; mail: { configured: boolean; from: string } };
type Key = keyof Settings;

const SECTIONS: { id: string; label: string }[] = [
  { id: "school", label: "School" },
  { id: "contact", label: "Contact details" },
  { id: "social", label: "Social links" },
  { id: "hours", label: "Office hours" },
  { id: "announcement", label: "Announcement bar" },
  { id: "notifications", label: "Notification emails" },
  { id: "email", label: "Email delivery" },
  { id: "analytics", label: "Analytics" },
  { id: "campuses", label: "Campuses" },
];

/** Saves one settings group; returns the saved (normalised) value. */
function useSave<K extends Key>(key: K, onSaved: (v: Settings[K]) => void) {
  const { api, toast, user } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ at: string; by: string | null } | undefined>();
  const save = async (value: Settings[K]) => {
    setBusy(true);
    setError("");
    try {
      const res = await api<{ value: Settings[K] }>("/api/admin/settings", { method: "PUT", body: { key, value } });
      onSaved(res.value);
      setSaved({ at: new Date().toISOString(), by: user.name });
      toast("Saved. The website will show the change on the next page load.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { save, busy, error, saved };
}

function Group({ id, title, description, updated, busy, error, onSubmit, children, footerNote }: {
  id: string; title: string; description?: ReactNode; updated?: { at: string; by: string | null }; busy?: boolean; error?: string;
  onSubmit?: () => void; children: ReactNode; footerNote?: ReactNode;
}) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };
  const body = (
    <>
      <div className="border-b border-[#eaecf0] px-5 py-4">
        <h2 className="text-[16px] font-semibold text-[#101828]">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-[#667085]">{description}</p>}
      </div>
      <div className="flex flex-col gap-4 px-5 py-5">{children}</div>
      {onSubmit && (
        <div className="flex flex-col gap-3 border-t border-[#eaecf0] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            {error ? <ErrorNote>{error}</ErrorNote> : (
              <p className="text-[12px] text-[#98a2b3]">
                {footerNote ?? (updated ? `Last saved ${fmtDate(updated.at)}${updated.by ? ` by ${updated.by}` : ""}` : "Using the built-in defaults")}
              </p>
            )}
          </div>
          <Button type="submit" busy={busy}>Save</Button>
        </div>
      )}
    </>
  );
  return (
    <section id={id} className="scroll-mt-20">
      <Card>{onSubmit ? <form onSubmit={submit} noValidate>{body}</form> : body}</Card>
    </section>
  );
}

const grid2 = "grid gap-4 sm:grid-cols-2";

// ------------------------------------------------------------------ groups
function SchoolGroup({ initial, updated }: { initial: Settings["school"]; updated?: Updated[string] }) {
  const [f, setF] = useState(initial);
  const { save, busy, error, saved } = useSave("school", setF);
  return (
    <Group id="school" title="School" description="The school name used in the footer and emails." updated={saved ?? updated} busy={busy} error={error} onSubmit={() => save(f)}>
      <Field label="School name" htmlFor="s-name" required><Input id="s-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div className={grid2}>
        <Field label="Campus name" htmlFor="s-campus"><Input id="s-campus" value={f.campusName} onChange={(e) => setF({ ...f, campusName: e.target.value })} /></Field>
        <Field label="Tagline" htmlFor="s-tag"><Input id="s-tag" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></Field>
      </div>
    </Group>
  );
}

function ContactGroup({ initial, updated }: { initial: Settings["contact"]; updated?: Updated[string] }) {
  const [f, setF] = useState(initial);
  const { save, busy, error, saved } = useSave("contact", setF);
  const set = (k: keyof Settings["contact"]) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Group id="contact" title="Contact details" description="Shown in the site footer and used across the contact pages." updated={saved ?? updated} busy={busy} error={error} onSubmit={() => save(f)}>
      <div className={grid2}>
        <Field label="Phone" htmlFor="c-phone" required><Input id="c-phone" type="tel" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Phone link" htmlFor="c-href" hint="What phones dial, e.g. tel:+92938320011. Leave empty to build it from the phone number.">
          <Input id="c-href" value={f.phoneHref} onChange={set("phoneHref")} className="font-mono" />
        </Field>
        <Field label="Second phone" htmlFor="c-alt"><Input id="c-alt" type="tel" value={f.phoneAlt} onChange={set("phoneAlt")} /></Field>
        <Field label="WhatsApp number" htmlFor="c-wa" hint="e.g. +92 300 1234567"><Input id="c-wa" type="tel" value={f.whatsapp} onChange={set("whatsapp")} /></Field>
        <Field label="Email" htmlFor="c-email" required><Input id="c-email" type="email" value={f.email} onChange={set("email")} /></Field>
        <Field label="Admissions email" htmlFor="c-adm"><Input id="c-adm" type="email" value={f.admissionsEmail} onChange={set("admissionsEmail")} /></Field>
      </div>
      <Field label="Address" htmlFor="c-addr" required><Textarea id="c-addr" value={f.address} onChange={set("address")} className="min-h-[64px]" /></Field>
      <Field label="Google Maps link" htmlFor="c-map" hint="Full https:// link to the school on Google Maps."><Input id="c-map" type="url" value={f.mapUrl} onChange={set("mapUrl")} /></Field>
    </Group>
  );
}

const SOCIAL: { k: keyof Settings["social"]; label: string; ph: string }[] = [
  { k: "facebook", label: "Facebook", ph: "https://www.facebook.com/…" },
  { k: "instagram", label: "Instagram", ph: "https://www.instagram.com/…" },
  { k: "twitter", label: "X / Twitter", ph: "https://x.com/…" },
  { k: "linkedin", label: "LinkedIn", ph: "https://www.linkedin.com/…" },
  { k: "youtube", label: "YouTube", ph: "https://www.youtube.com/@…" },
  { k: "tiktok", label: "TikTok", ph: "https://www.tiktok.com/@…" },
];

function SocialGroup({ initial, updated }: { initial: Settings["social"]; updated?: Updated[string] }) {
  const [f, setF] = useState(initial);
  const { save, busy, error, saved } = useSave("social", setF);
  return (
    <Group id="social" title="Social links" description="Full https:// addresses. Leave a link empty to hide its icon in the footer." updated={saved ?? updated} busy={busy} error={error} onSubmit={() => save(f)}>
      <div className={grid2}>
        {SOCIAL.map((s) => (
          <Field key={s.k} label={s.label} htmlFor={`so-${s.k}`}>
            <Input id={`so-${s.k}`} type="url" value={f[s.k]} placeholder={s.ph} onChange={(e) => setF({ ...f, [s.k]: e.target.value })} />
          </Field>
        ))}
      </div>
    </Group>
  );
}

function HoursGroup({ initial, updated }: { initial: Settings["hours"]; updated?: Updated[string] }) {
  const [f, setF] = useState(initial);
  const { save, busy, error, saved } = useSave("hours", setF);
  return (
    <Group id="hours" title="Office hours" updated={saved ?? updated} busy={busy} error={error} onSubmit={() => save(f)}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Monday to Friday" htmlFor="h-wd"><Input id="h-wd" value={f.weekdays} onChange={(e) => setF({ ...f, weekdays: e.target.value })} /></Field>
        <Field label="Saturday" htmlFor="h-sat"><Input id="h-sat" value={f.saturday} onChange={(e) => setF({ ...f, saturday: e.target.value })} /></Field>
        <Field label="Sunday" htmlFor="h-sun"><Input id="h-sun" value={f.sunday} onChange={(e) => setF({ ...f, sunday: e.target.value })} /></Field>
      </div>
      <Field label="Note" htmlFor="h-note"><Textarea id="h-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className="min-h-[64px]" /></Field>
    </Group>
  );
}

function AnnouncementGroup({ initial, updated }: { initial: Settings["announcement"]; updated?: Updated[string] }) {
  const [f, setF] = useState(initial);
  const { save, busy, error, saved } = useSave("announcement", setF);
  return (
    <Group
      id="announcement"
      title="Announcement bar"
      description="The strip at the very top of every page. A pinned notice (Notices) replaces this text while it is live."
      updated={saved ?? updated} busy={busy} error={error} onSubmit={() => save(f)}
    >
      <Checkbox label="Show the announcement bar" checked={f.show} onChange={(show) => setF({ ...f, show })} />
      <div className={grid2}>
        <Field label="Text" htmlFor="a-text" required={f.show}><Input id="a-text" value={f.text} maxLength={160} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
        <Field label="Link" htmlFor="a-href" hint="A page on this site, e.g. /admissions, or a full https:// address."><Input id="a-href" value={f.href} onChange={(e) => setF({ ...f, href: e.target.value })} /></Field>
      </div>
    </Group>
  );
}

const NOTIFY: { k: keyof Settings["notifications"]; label: string; hint: string }[] = [
  { k: "enquire", label: "Admission enquiries", hint: "Enquire Now form" },
  { k: "visit", label: "Campus visit requests", hint: "Enquire Now form with “book a campus visit” ticked" },
  { k: "contact", label: "Contact messages", hint: "Contact Us form" },
  { k: "newsletter", label: "Newsletter sign-ups", hint: "Footer newsletter form (leave empty for no emails)" },
];

function NotificationsGroup({ initial, updated }: { initial: Settings["notifications"]; updated?: Updated[string] }) {
  const toText = (v: Settings["notifications"]) => Object.fromEntries(NOTIFY.map((n) => [n.k, v[n.k].join("\n")])) as Record<keyof Settings["notifications"], string>;
  const [f, setF] = useState(() => toText(initial));
  const { save, busy, error, saved } = useSave("notifications", (v) => setF(toText(v)));
  const split = (s: string) => s.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
  return (
    <Group
      id="notifications"
      title="Notification emails"
      description="Who is emailed when someone submits a form. One address per line (up to 10)."
      updated={saved ?? updated} busy={busy} error={error}
      onSubmit={() => save({ enquire: split(f.enquire), visit: split(f.visit), contact: split(f.contact), newsletter: split(f.newsletter) })}
    >
      <div className={grid2}>
        {NOTIFY.map((n) => (
          <Field key={n.k} label={n.label} htmlFor={`n-${n.k}`} hint={n.hint}>
            <Textarea id={`n-${n.k}`} value={f[n.k]} rows={3} className="min-h-[76px] font-mono text-[13px]" spellCheck={false}
              placeholder="name@alsswabi.edu.pk" onChange={(e) => setF({ ...f, [n.k]: e.target.value })} />
          </Field>
        ))}
      </div>
    </Group>
  );
}

function AnalyticsGroup({ initial, updated }: { initial: Settings["analytics"]; updated?: Updated[string] }) {
  const [f, setF] = useState(initial);
  const { save, busy, error, saved } = useSave("analytics", setF);
  const gaBad = f.gaId.trim() !== "" && !/^G-[A-Z0-9]{4,12}$/i.test(f.gaId.trim());
  const gtmBad = f.gtmId.trim() !== "" && !/^GTM-[A-Z0-9]{4,10}$/i.test(f.gtmId.trim());
  return (
    <Group id="analytics" title="Analytics" description="Optional. Leave empty to load no tracking scripts." updated={saved ?? updated} busy={busy} error={error} onSubmit={() => save(f)}>
      <div className={grid2}>
        <Field label="Google Analytics 4 measurement ID" htmlFor="an-ga" hint="Looks like G-XXXXXXXXXX." error={gaBad ? "Should look like G-XXXXXXXXXX." : undefined}>
          <Input id="an-ga" value={f.gaId} placeholder="G-XXXXXXXXXX" className="font-mono uppercase" onChange={(e) => setF({ ...f, gaId: e.target.value })} />
        </Field>
        <Field label="Google Tag Manager container ID" htmlFor="an-gtm" hint="Looks like GTM-XXXXXXX." error={gtmBad ? "Should look like GTM-XXXXXXX." : undefined}>
          <Input id="an-gtm" value={f.gtmId} placeholder="GTM-XXXXXXX" className="font-mono uppercase" onChange={(e) => setF({ ...f, gtmId: e.target.value })} />
        </Field>
      </div>
    </Group>
  );
}

function EmailGroup({ mail }: { mail: SettingsRes["mail"] }) {
  const { api, toast, user } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const test = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api<{ to: string }>("/api/admin/settings/test-email", { method: "POST" });
      toast(`Test email sent to ${res.to}. Check the inbox (and spam folder).`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Group id="email" title="Email delivery" description="How the website sends form notifications and assignment emails.">
      <div className="flex flex-wrap items-center gap-2 text-[14px]">
        <span className="text-[#344054]">Outgoing email (SMTP):</span>
        {mail.configured ? <Badge tone="green">Configured</Badge> : <Badge tone="amber">Not configured</Badge>}
        {mail.configured && mail.from && <span className="text-[13px] text-[#667085]">Sending as {mail.from}</span>}
      </div>
      <div className="rounded-lg bg-[#f9fafb] px-4 py-3 text-[13px] leading-[20px] text-[#475467]">
        <p>
          For security, the mail server settings are <strong>never stored in the database</strong> and cannot be changed here. They live in the
          server environment (the <code className="rounded bg-white px-1 font-mono text-[12px]">.env.local</code> file next to the website, or the
          hosting panel&apos;s environment variables):
        </p>
        <p className="mt-2 font-mono text-[12px] text-[#344054]">SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM</p>
        <p className="mt-2">After changing them, restart the website. {mail.configured ? "" : "Until then, submissions are still saved here in Enquiries; only the emails are skipped."}</p>
      </div>
      <div className="flex flex-col items-start gap-2">
        <Button tone="secondary" onClick={test} busy={busy} disabled={!mail.configured || !user.email}>Send test email</Button>
        <p className="text-[12px] text-[#667085]">
          {user.email ? `Sends a test message to your own address, ${user.email}.` : "Add an email address to your account (My account) to send a test."}
          {!mail.configured && " Available once SMTP is configured."}
        </p>
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Group>
  );
}

// ------------------------------------------------------------------ screen
export default function SettingsScreen() {
  const { api } = useAdmin();
  const [data, setData] = useState<SettingsRes | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api<SettingsRes>("/api/admin/settings"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <>
      <PageHeader title="Settings" description="School details, contact information, social links and who receives form emails." />
      {error ? (
        <ErrorNote>{error}</ErrorNote>
      ) : !data ? (
        <p className="py-14 text-center text-[14px] text-[#667085]">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
          <nav aria-label="Settings sections" className="hidden lg:block">
            <ul className="sticky top-6 flex flex-col gap-0.5 text-[14px]">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block rounded-md px-3 py-1.5 text-[#475467] hover:bg-white hover:text-[#101828]">{s.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex min-w-0 flex-col gap-6">
            <SchoolGroup initial={data.settings.school} updated={data.updated.school} />
            <ContactGroup initial={data.settings.contact} updated={data.updated.contact} />
            <SocialGroup initial={data.settings.social} updated={data.updated.social} />
            <HoursGroup initial={data.settings.hours} updated={data.updated.hours} />
            <AnnouncementGroup initial={data.settings.announcement} updated={data.updated.announcement} />
            <NotificationsGroup initial={data.settings.notifications} updated={data.updated.notifications} />
            <EmailGroup mail={data.mail} />
            <AnalyticsGroup initial={data.settings.analytics} updated={data.updated.analytics} />
            <CampusesCard />
          </div>
        </div>
      )}
    </>
  );
}
