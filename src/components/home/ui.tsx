/* Shared bits for the home page sections (buttons, eyebrow labels, round arrow buttons, admin-content helpers). */

import Link from "next/link";
import type { ReactNode } from "react";
import { isInternal } from "@/lib/content";

/** next/image only optimises local files; an external address is shown as-is. */
export const unoptimized = (src: string) => /^(https?:)?\/\//i.test(src);

/** 0 → "01", 1 → "02", … (automatic numbering for list items). */
export const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * Keeps a space before each typed line break, so a break that is hidden on some
 * screens (brClassName "hidden lg:block") never glues two words together.
 */
export const softBreaks = (text: string) => text.replace(/([^\s])\r?\n/g, "$1 \n");

/** Admin-edited link: internal → <Link>, http(s) → new tab, anything else (tel:, mailto:, #) → plain <a>. */
export function CmsLink({ href, className, children, tabIndex }: { href: string; className?: string; children: ReactNode; tabIndex?: number }) {
  if (isInternal(href))
    return (
      <Link href={href} className={className} tabIndex={tabIndex}>
        {children}
      </Link>
    );
  if (/^(https?:)?\/\//i.test(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} tabIndex={tabIndex}>
        {children}
      </a>
    );
  return (
    <a href={href} className={className} tabIndex={tabIndex}>
      {children}
    </a>
  );
}

/** Base for the rectangular CTA buttons used across the home page (Figma "Button Component" / "Link"). */
export const btn =
  "inline-flex items-center justify-center px-[30px] py-[17px] text-center font-inter text-[17.134px] uppercase leading-[20.157px] tracking-[1.8898px] whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson";

export const btnCrimson = `${btn} bg-crimson text-white hover:bg-navy`;
export const btnNavy = `${btn} border border-navy bg-navy text-white hover:border-crimson hover:bg-crimson`;
export const btnWhite = `${btn} bg-white font-medium text-crimson hover:bg-navy hover:text-white`;
export const btnOutline = `${btn} border border-black text-black hover:bg-black hover:text-white`;

/** Small uppercase label above section headings ("WELCOME TO SWABI CAMPUS", "OUR LOCATION"…). */
export const eyebrow =
  "font-inter text-[13px] font-semibold uppercase leading-[20px] tracking-[2px] lg:text-[13.102px] lg:leading-[16.63px] lg:tracking-[2.0157px]";

/** Section heading: 30/34 on mobile, 49.89/57.449 on desktop. */
export const heading =
  "font-inter text-[30px] font-normal leading-[34px] lg:text-[clamp(38px,2.6vw,49.89px)] lg:leading-[1.1515]";

/** Body copy: 16/25 on mobile, 16.227/26.205 on desktop. */
export const body =
  "font-inter text-[16px] leading-[25px] tracking-[0.4969px] lg:text-[16.227px] lg:leading-[26.205px] lg:tracking-[0.5039px]";

type ArrowCircleProps = {
  direction: "prev" | "next";
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

/** 45×45 round white button with the crimson arrow (Figma "Arrow Hover"). */
export function ArrowCircle({ direction, label, onClick, disabled, className = "" }: ArrowCircleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`group/arrow relative inline-flex size-[45.354px] shrink-0 cursor-pointer items-center justify-center rounded-full border-[2.017px] border-[#d6d6d6] bg-white transition-colors duration-200 hover:border-crimson focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson disabled:cursor-default disabled:opacity-40 disabled:hover:border-[#d6d6d6] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/home/arrow-right.svg"
        alt=""
        width={24.189}
        height={24.214}
        className={`h-[24.214px] w-[24.189px] transition-transform duration-200 ${
          direction === "prev" ? "rotate-180 group-hover/arrow:-translate-x-0.5" : "group-hover/arrow:translate-x-0.5"
        }`}
      />
    </button>
  );
}

/** Decorative round arrow (same art as ArrowCircle) used inside cards that are already links. */
export function ArrowBadge({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex size-[45.354px] shrink-0 items-center justify-center rounded-full border-[2.017px] border-[#d6d6d6] bg-white transition-colors duration-200 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/home/arrow-right.svg" alt="" width={24.189} height={24.214} className="h-[24.214px] w-[24.189px]" />
    </span>
  );
}
