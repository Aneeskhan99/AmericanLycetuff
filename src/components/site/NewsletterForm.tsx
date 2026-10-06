"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { captureLanding } from "@/lib/public/tracking";

type State = { kind: "idle" | "sending" | "ok" | "error"; text: string };

/**
 * Footer newsletter sign-up (every page). Posts to /api/subscribe; the list is in
 * Admin → Subscribers. As in the Figma footer, only the "Subscribe" button shows at
 * first; pressing it opens the email field next to it. Because the footer is on every page, this component also
 * records where the visit started (referrer + UTM tags) for the enquiry forms.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle", text: "" });
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    captureLanding();
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === "sending") return;
    const value = email.trim();
    if (!value) return setState({ kind: "error", text: "Please enter your email address." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setState({ kind: "error", text: "Please enter a valid email address, e.g. name@email.com." });

    const website = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    setState({ kind: "sending", text: "" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, website, sourcePage: window.location.pathname }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; already?: boolean; error?: string } | null;
      if (res.ok && data?.ok) {
        setEmail("");
        setState({ kind: "ok", text: data.already ? "You are already subscribed. Thank you!" : "Thank you! You are now subscribed." });
        return;
      }
      setState({ kind: "error", text: data?.error || "Sorry, we could not sign you up right now. Please try again." });
    } catch {
      setState({ kind: "error", text: "Sorry, we could not sign you up right now. Please try again." });
    }
  }

  const sending = state.kind === "sending";
  const invalid = state.kind === "error";

  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label="Newsletter sign-up"
      className="relative mt-[28px] w-full max-w-[323px] nav:mt-[43px] nav:max-w-[640px]"
    >
      {/* Honeypot: hidden from people, filled only by bots. */}
      <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="flex flex-col gap-[10px] nav:flex-row nav:gap-0">
        {open && (
          <>
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              ref={inputRef}
              id="newsletter-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state.kind !== "idle" && state.kind !== "sending") setState({ kind: "idle", text: "" });
              }}
              aria-invalid={invalid || undefined}
              aria-describedby={state.text ? "newsletter-status" : undefined}
              className={`h-[48px] w-full min-w-0 border bg-white px-[16px] font-inter text-[15px] text-navy outline-none transition-colors placeholder:text-[#8a8f99] focus:border-navy focus-visible:ring-2 focus-visible:ring-navy/20 nav:h-auto nav:flex-1 nav:border-r-0 nav:px-[20px] nav:text-[16px] ${
                invalid ? "border-crimson" : "border-[#d6d6d6]"
              }`}
            />
          </>
        )}
        <button
          type={open ? "submit" : "button"}
          onClick={
            open
              ? undefined
              : (e) => {
                  // The button turns into "submit" during this click; stop it submitting the still empty form.
                  e.preventDefault();
                  setOpen(true);
                }
          }
          aria-expanded={open ? undefined : false}
          aria-controls={open ? "newsletter-email" : undefined}
          disabled={sending}
          aria-busy={sending || undefined}
          className="flex w-full items-center justify-center whitespace-nowrap bg-navy px-[12px] py-[17px] font-inter text-[14px] font-medium uppercase leading-[14px] tracking-[1px] text-white transition-colors hover:bg-crimson focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson disabled:cursor-wait disabled:opacity-80 nav:w-auto nav:shrink-0 nav:px-[30px] nav:text-[17.134px] nav:font-normal nav:leading-[20.157px] nav:tracking-[1.8898px]"
        >
          {sending && <span aria-hidden className="mr-[10px] inline-block size-[14px] animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          Subscribe to American Lycetuff
        </button>
      </div>

      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className={`font-inter text-[14px] leading-[20px] ${state.text ? "mt-[10px]" : ""} ${state.kind === "error" ? "text-crimson" : "text-navy"}`}
      >
        {state.kind === "ok" && <span aria-hidden className="mr-[6px] font-bold">✓</span>}
        {state.text}
      </p>
    </form>
  );
}
