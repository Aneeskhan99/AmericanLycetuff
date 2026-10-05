import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outgoing email. SMTP credentials come ONLY from environment variables
 * (.env.local / the server's environment) — never from code or the database.
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 * Without SMTP_HOST nothing is sent and the result says "skipped".
 */
let transporter: Transporter | null = null;

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

function transport(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export type MailResult = "sent" | "skipped (no SMTP)" | `failed: ${string}`;

export async function sendMail(m: { to: string | string[]; subject: string; text: string; html?: string; replyTo?: string }): Promise<MailResult> {
  const to = (Array.isArray(m.to) ? m.to : [m.to]).map((s) => s.trim()).filter(Boolean);
  if (!to.length) return "skipped (no SMTP)";
  if (!mailConfigured()) {
    console.info(`[mail] SMTP not configured; would send "${m.subject}" to ${to.length} recipient(s).`);
    return "skipped (no SMTP)";
  }
  try {
    await transport().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to.join(", "),
      subject: m.subject,
      text: m.text,
      html: m.html,
      replyTo: m.replyTo || undefined,
    });
    return "sent";
  } catch (err) {
    console.error("[mail]", err);
    return `failed: ${(err as Error).message.slice(0, 160)}`;
  }
}

/** Escapes text for use inside simple HTML emails. */
export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3002").replace(/\/$/, "");
}
