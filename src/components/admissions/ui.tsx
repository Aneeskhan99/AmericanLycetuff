import Link from "next/link";
import type { ReactNode } from "react";
import { isInternal } from "@/lib/content";
import { Rich } from "@/components/site/Rich";

/** Centered content column: 1498px wide at 1920 (x=211 → 1709 in the Figma frame). */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1498px] ${className}`}>{children}</div>;
}

/** Section side padding: 24px on mobile, scales on desktop so 1920 keeps the 211px content offset. */
export const sectionX = "px-6 lg:px-[clamp(40px,4vw,80px)]";

type Tone = "light" | "dark";

/**
 * Eyebrow + two-tone heading used by every section.
 * Mobile: centered 13/20 eyebrow, 14px gap, 34/38 heading.
 * Desktop: left aligned 13.1px eyebrow, 20px gap, 72/80 heading (64/72 when `compact`).
 */
export function SectionHeading({
  id,
  eyebrow,
  heading,
  tone = "light",
  eyebrowClassName,
  compact = false,
  className = "",
}: {
  id?: string;
  eyebrow: string;
  /** Editable heading; *words* = crimson accent. A one-word accent never wraps (e.g. "2027-28"). */
  heading: string;
  tone?: Tone;
  eyebrowClassName?: string;
  compact?: boolean;
  className?: string;
}) {
  const eyebrowColor = eyebrowClassName ?? (tone === "dark" ? "text-[#fd0]" : "text-black");
  const accent = /\*([^*]+)\*/.exec(heading)?.[1] ?? "";
  return (
    <div className={`text-center lg:text-left ${className}`}>
      <p
        className={`text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] lg:text-[13.1px] lg:leading-[normal] lg:tracking-[2px] ${eyebrowColor}`}
      >
        {eyebrow}
      </p>
      <h2
        id={id}
        className={`mt-[14px] font-normal lg:mt-[20px] ${
          compact
            ? "text-[32px] leading-[36px] tracking-[-0.5px] lg:text-[clamp(48px,3.34vw,64px)] lg:leading-[1.125] lg:tracking-[-1px]"
            : "text-[34px] leading-[38px] tracking-[-0.4722px] lg:text-[clamp(52px,3.75vw,72px)] lg:leading-[1.111] lg:tracking-[-1px]"
        } ${tone === "dark" ? "text-white" : "text-black"}`}
      >
        <Rich text={heading} hl={`text-crimson ${accent.includes(" ") ? "" : "whitespace-nowrap"}`} />
      </h2>
    </div>
  );
}

/** Outlined chip / tag. */
export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`flex items-center justify-center border border-solid px-4 py-[13px] text-center text-[14px] font-medium leading-[normal] lg:inline-flex lg:items-start lg:py-[10px] ${className}`}
    >
      {children}
    </span>
  );
}

const buttonBase =
  "inline-flex items-center justify-center px-[30px] text-[17.13px] font-medium uppercase leading-[normal] tracking-[1.9px] whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fd0]";

/** Admin-edited link: internal → <Link>, http(s) → new tab, anything else (tel:, mailto:, #) → plain <a>. */
export function CmsLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (isInternal(href))
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  if (/^(https?:)?\/\//i.test(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/** next/image only optimises local files; anything external is shown as-is. */
export const unoptimized = (src: string) => /^(https?:)?\/\//i.test(src);

/** "One per line" admin text → trimmed, non-empty lines. */
export const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/** White filled button with crimson label (Figma "Button / Filled"). */
export function FilledButton({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <CmsLink href={href} className={`${buttonBase} bg-white py-[17px] text-crimson hover:bg-crimson hover:text-white ${className}`}>
      {children}
    </CmsLink>
  );
}

/** White outlined button (Figma "Button / Stroked"). */
export function StrokedButton({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <CmsLink
      href={href}
      className={`${buttonBase} border-2 border-solid border-white py-[15px] text-white hover:bg-white hover:text-navy-ink ${className}`}
    >
      {children}
    </CmsLink>
  );
}
