"use client";

/**
 * Shared form helpers for the Contact (/contact) and Enquire (/enquire) forms:
 * validation rules, the POST to /api/enquiry (with the visitor's source: page,
 * referrer and UTM tags from @/lib/public/tracking), the honeypot field and the
 * status UI (spinner button, error alert, success panel).
 */
import { useState } from "react";
import { contact } from "@/components/layout/nav-links";
import { trackingPayload } from "@/lib/public/tracking";

export type Values = Record<string, string>;
export type Errors = Partial<Record<string, string>>;
export type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const rules = {
  name(v: string, label = "your full name") {
    const s = v.trim();
    if (!s) return `Please enter ${label}.`;
    if (s.length < 2) return "Please enter at least 2 characters.";
    return undefined;
  },
  phone(v: string) {
    const s = v.trim();
    if (!s) return "Please enter your phone number.";
    if (!/^[+\d\s()-]+$/.test(s)) return "Please use digits only, e.g. 0300 1234567.";
    const digits = s.replace(/\D/g, "").length;
    if (digits < 10 || digits > 13) return "Please enter a valid phone number, e.g. 0300 1234567.";
    return undefined;
  },
  optionalEmail(v: string) {
    const s = v.trim();
    if (s && !EMAIL_RE.test(s)) return "Please enter a valid email address, e.g. name@email.com.";
    return undefined;
  },
  required(v: string, message: string) {
    return v.trim() ? undefined : message;
  },
};

/**
 * Generic form state hook: values, per-field errors (shown after blur or first submit) and submit status.
 * `prepare` can adjust the values just before they are sent (e.g. fill a default chosen from the URL).
 */
export function useEnquiryForm(
  initial: Values,
  validate: (v: Values) => Errors,
  form: "contact" | "enquire",
  prepare: (v: Values) => Values = (v) => v,
) {
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");

  const visibleError = (name: string) => (attempted || touched[name] ? errors[name] : undefined);

  function setField(name: string, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    if (attempted || touched[name]) setErrors(validate(next));
    if (status === "error") setStatus("idle");
  }

  function blurField(name: string) {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors(validate(values));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setAttempted(true);
    const errs = validate(values);
    setErrors(errs);
    const firstInvalid = Object.keys(errs).find((k) => errs[k]);
    if (firstInvalid) {
      const el = e.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`);
      el?.focus();
      return;
    }

    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    setStatus("submitting");
    setServerError("");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...trackingPayload(), ...prepare(values), form, website: honeypot }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && data?.ok) {
        setStatus("success");
        return;
      }
      setServerError(data?.error || "");
      setStatus("error");
    } catch {
      setServerError("");
      setStatus("error");
    }
  }

  function reset() {
    setValues(initial);
    setErrors({});
    setTouched({});
    setAttempted(false);
    setServerError("");
    setStatus("idle");
  }

  return { values, setField, blurField, visibleError, submit, status, serverError, reset };
}

/** Hidden honeypot input; real users never see or fill it. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-[8px] flex items-start gap-[6px] text-[14px] leading-[20px] text-crimson">
      <span aria-hidden className="mt-[3px] inline-flex size-[14px] shrink-0 items-center justify-center rounded-full bg-crimson text-[10px] font-bold leading-none text-white">
        !
      </span>
      {message}
    </p>
  );
}

export function FormErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="border-l-[4px] border-crimson bg-[#fdecf0] px-[18px] py-[14px] text-[15px] leading-[23px] text-[#7a0b28]">
      {message || "Sorry, we could not send your message right now. Please try again, or call us on "}
      {!message && (
        <a href={contact.phoneHref} className="font-semibold underline">
          {contact.phone}
        </a>
      )}
      {!message && "."}
    </div>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="mr-[12px] inline-block size-[16px] animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

export function SuccessPanel({
  title,
  body,
  againLabel,
  onAgain,
}: {
  title: string;
  body: string;
  againLabel: string;
  onAgain: () => void;
}) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center py-[24px] text-center lg:items-start lg:text-left">
      <span aria-hidden className="flex size-[56px] items-center justify-center rounded-full bg-crimson text-[26px] font-bold text-white">
        ✓
      </span>
      <h3 className="mt-[20px] text-[28px] font-medium leading-[34px] text-navy lg:text-[32px] lg:leading-[40px]">{title}</h3>
      <p className="mt-[12px] max-w-[560px] text-[17px] leading-[27px] tracking-[0.3px] text-[#5c5c5c]">{body}</p>
      <button
        type="button"
        onClick={onAgain}
        className="mt-[28px] inline-flex items-center justify-center border-2 border-navy px-[30px] py-[15px] text-[15px] font-medium uppercase tracking-[1.9px] text-navy transition-colors hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
      >
        {againLabel}
      </button>
    </div>
  );
}
