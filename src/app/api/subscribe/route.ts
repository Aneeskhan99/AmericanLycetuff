import { after, NextResponse } from "next/server";
import { one } from "@/lib/db";
import { ipHash, memoryLimited, requestIp, sameOrigin } from "@/lib/enquiries";
import { esc, sendMail, siteUrl } from "@/lib/mail";
import { getSettings } from "@/lib/settings";

/**
 * POST /api/subscribe — the newsletter sign-up in the site footer.
 * Body: { email, website (honeypot), sourcePage }
 * Adds the address to `subscribers` (Admin → Subscribers); an address that had
 * unsubscribed is subscribed again. Notifies settings.notifications.newsletter,
 * if any addresses are set, about new and returning subscribers.
 * Response: { ok: true, already?: true } or { ok: false, error }.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 422) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail("Please sign up from our website.", 403);

  let b: Record<string, unknown>;
  try {
    const raw = await req.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error();
    b = raw as Record<string, unknown>;
  } catch {
    return fail("Invalid request.", 400);
  }
  if (typeof b.website === "string" && b.website.trim()) return NextResponse.json({ ok: true });

  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!email) return fail("Please enter your email address.");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Please enter a valid email address, e.g. name@email.com.");
  // Counted after validation, so a typo does not use up an attempt.
  if (memoryLimited(`sub:${ipHash(requestIp(req))}`, 5, 10 * 60_000)) {
    return fail("Too many sign-ups from your connection. Please try again in a few minutes.", 429);
  }

  const page = typeof b.sourcePage === "string" && b.sourcePage.startsWith("/") ? b.sourcePage.slice(0, 300) : "";

  let row: { id: string; status: string; was: string | null } | null;
  try {
    // "was" is the status before this request (null = brand-new row).
    row = await one(
      `WITH prev AS (SELECT status FROM subscribers WHERE lower(email) = $1)
       INSERT INTO subscribers (email, source_page) VALUES ($1, $2)
       ON CONFLICT ((lower(email))) DO UPDATE
         SET status = 'subscribed', unsubscribed_at = NULL
       RETURNING id, status, (SELECT status FROM prev) AS was`,
      [email, page],
    );
  } catch (err) {
    console.error("[subscribe]", err);
    return fail("We could not sign you up right now. Please try again later.", 500);
  }
  if (!row) return fail("We could not sign you up right now. Please try again later.", 500);

  if (row.was === "subscribed") return NextResponse.json({ ok: true, already: true });

  const returning = row.was === "unsubscribed";
  after(async () => {
    try {
      const to = (await getSettings()).notifications.newsletter ?? [];
      if (!to.length) return;
      const link = `${siteUrl()}/admin/subscribers`;
      const what = returning ? "subscribed again" : "subscribed";
      await sendMail({
        to,
        subject: `Newsletter: ${email} ${what}`,
        text: `${email} ${what} to the American Lycetuff newsletter${page ? ` from ${page}` : ""}.\n\nAll subscribers: ${link}`,
        html: `<p style="font-family:Arial,sans-serif;font-size:14px"><strong>${esc(email)}</strong> ${what} to the American Lycetuff newsletter${page ? ` from ${esc(page)}` : ""}.</p><p style="font-family:Arial,sans-serif;font-size:14px"><a href="${esc(link)}">All subscribers</a></p>`,
      });
    } catch (err) {
      console.error("[subscribe] notification failed", err);
    }
  });

  return NextResponse.json({ ok: true });
}
