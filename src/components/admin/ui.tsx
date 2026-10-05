"use client";

import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

/* Shared admin building blocks: one look for every screen. */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ------------------------------------------------------------------ buttons
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  busy?: boolean;
};
export function Button({ tone = "primary", size = "md", busy, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a2d59] disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-[14px]",
        tone === "primary" && "bg-[#1a2d59] text-white hover:bg-[#13224a]",
        tone === "secondary" && "border border-[#d0d5dd] bg-white text-[#1d2939] hover:bg-[#f2f4f7]",
        tone === "danger" && "bg-[#d31245] text-white hover:bg-[#b00f3a]",
        tone === "ghost" && "text-[#344054] hover:bg-[#f2f4f7]",
        className,
      )}
    >
      {busy && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ form fields
export function Field({ label, hint, error, children, htmlFor, required }: {
  label: string; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-[#344054]">
        {label}
        {required && <span className="text-[#d31245]"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[12px] text-[#667085]">{hint}</p>}
      {error && <p className="text-[12px] text-[#b42318]">{error}</p>}
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-md border border-[#d0d5dd] bg-white px-3 text-[14px] text-[#101828] placeholder:text-[#98a2b3] focus:border-[#1a2d59] focus:outline-none focus:ring-2 focus:ring-[#1a2d59]/15 disabled:bg-[#f9fafb]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx(inputCls, "pr-8", props.className)}>
      {children}
    </select>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <svg className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <Input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" aria-label={placeholder} />
    </div>
  );
}

// ------------------------------------------------------------------ layout bits
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[22px] font-semibold text-[#101828]">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-[#667085]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-xl border border-[#eaecf0] bg-white", className)}>{children}</div>;
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "green" | "red" | "blue" | "amber" }) {
  const tones = {
    gray: "bg-[#f2f4f7] text-[#344054]",
    green: "bg-[#ecfdf3] text-[#027a48]",
    red: "bg-[#fef3f2] text-[#b42318]",
    blue: "bg-[#eff4ff] text-[#1a2d59]",
    amber: "bg-[#fffaeb] text-[#b54708]",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium", tones[tone])}>{children}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-[15px] font-medium text-[#101828]">{title}</p>
      {children && <div className="mt-1 text-[14px] text-[#667085]">{children}</div>}
    </div>
  );
}

// ------------------------------------------------------------------ table
export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
        <thead className="bg-[#f9fafb] text-[12px] font-medium uppercase tracking-wide text-[#667085]">
          <tr className="[&>th]:border-b [&>th]:border-[#eaecf0] [&>th]:px-4 [&>th]:py-3">{head}</tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-[#f2f4f7] [&>tr:last-child]:border-0 [&_td]:px-4 [&_td]:py-3">{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#eaecf0] px-4 py-3 text-[13px] text-[#667085]">
      <span>{total === 0 ? "No results" : `${from}–${to} of ${total}`}</span>
      <div className="flex gap-2">
        <Button tone="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button tone="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ dialogs
export function Dialog({ open, title, onClose, children, footer, wide }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={cx(
        "m-auto w-[calc(100%-32px)] rounded-xl bg-white p-0 text-[#101828] shadow-2xl backdrop:bg-[#0c111d]/50",
        wide ? "max-w-[720px]" : "max-w-[480px]",
      )}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between border-b border-[#eaecf0] px-5 py-4">
            <h2 id={titleId} className="text-[16px] font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="rounded p-1 text-[#667085] hover:bg-[#f2f4f7]" aria-label="Close">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-[#eaecf0] px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", tone = "danger", busy, onConfirm, onCancel }: {
  open: boolean; title: string; message: ReactNode; confirmLabel?: string; tone?: "danger" | "primary"; busy?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button tone="secondary" onClick={onCancel}>Cancel</Button>
          <Button tone={tone} busy={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="text-[14px] text-[#475467]">{message}</div>
    </Dialog>
  );
}

export { fmtDate } from "@/lib/format";

// ------------------------------------------------------------------ more fields
export function Textarea(props: import("react").TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        "min-h-[96px] w-full rounded-md border border-[#d0d5dd] bg-white px-3 py-2 text-[14px] text-[#101828] placeholder:text-[#98a2b3] focus:border-[#1a2d59] focus:outline-none focus:ring-2 focus:ring-[#1a2d59]/15 disabled:bg-[#f9fafb]",
        props.className,
      )}
    />
  );
}

export function Checkbox({ label, hint, checked, onChange, id }: { label: ReactNode; hint?: ReactNode; checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <label htmlFor={cid} className="flex cursor-pointer items-start gap-2.5">
      <input id={cid} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-[#1a2d59]" />
      <span>
        <span className="block text-[14px] text-[#344054]">{label}</span>
        {hint && <span className="block text-[12px] text-[#667085]">{hint}</span>}
      </span>
    </label>
  );
}

/** A row of filter controls above a table. */
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 border-b border-[#eaecf0] p-4 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="rounded-md bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]">{children}</p>;
}

/** Turns "Sports Day 2026!" into "sports-day-2026". */
export function slugify(s: string) {
  return s.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().toLowerCase().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
