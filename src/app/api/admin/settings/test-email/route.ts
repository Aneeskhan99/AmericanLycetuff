import { guard, HttpError, json } from "@/lib/admin-route";
import { audit } from "@/lib/db";
import { esc, mailConfigured, sendMail, siteUrl } from "@/lib/mail";

/** POST /api/admin/settings/test-email — sends a test message to the signed-in administrator's own email. */
export const POST = guard(
  async ({ session }) => {
    const to = session.user.email;
    if (!to) throw new HttpError(422, "Your account has no email address. Add one under My account first.");
    if (!mailConfigured()) {
      throw new HttpError(422, "Email is not set up on this server yet (SMTP_HOST is empty), so nothing can be sent.");
    }
    const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" });
    const result = await sendMail({
      to,
      subject: "Test email from the American Lycetuff website",
      text: `Hello ${session.user.name},\n\nThis is a test email sent from the website admin (${siteUrl()}/admin/settings) at ${when} (Pakistan time).\nIf you can read this, form notification emails are working.`,
      html: `<p style="font-family:Arial,sans-serif;font-size:14px">Hello ${esc(session.user.name)},</p><p style="font-family:Arial,sans-serif;font-size:14px">This is a test email sent from the website admin at ${esc(when)} (Pakistan time).<br>If you can read this, form notification emails are working.</p>`,
    });
    await audit(session.user.id, "setting", "mail", "test_email", { result });
    if (result !== "sent") throw new HttpError(502, `The email could not be sent: ${result}`);
    return json({ ok: true, to });
  },
  { roles: ["administrator"] },
);
