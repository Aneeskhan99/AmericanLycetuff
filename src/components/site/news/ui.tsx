import Link from "next/link";
import type { ReactNode } from "react";
import { Rich } from "@/components/site/Rich";

/* Building blocks for the News pages, in the same style as the rest of the site. */

/** 1498px content column inside the 1920 frame, 24px gutters on mobile. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="frame gutter">
      <div className={`mx-auto w-full max-w-[1498px] ${className}`}>{children}</div>
    </div>
  );
}

export const eyebrow =
  "text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] lg:text-[13.1px] lg:leading-normal lg:tracking-[2px]";

/** Eyebrow + two-tone H2 (*word* = crimson). */
export function SectionHeading({ id, label, heading, className = "" }: { id?: string; label: string; heading: string; className?: string }) {
  return (
    <div className={`text-center lg:text-left ${className}`}>
      <p className={`${eyebrow} text-black`}>{label}</p>
      <h2
        id={id}
        className="mt-[14px] text-[34px] font-normal leading-[38px] tracking-[-0.4722px] text-black lg:mt-[20px] lg:text-[clamp(44px,3.1vw,60px)] lg:leading-[1.133] lg:tracking-[-1px]"
      >
        <Rich text={heading} />
      </h2>
    </div>
  );
}

const btnBase =
  "inline-flex items-center justify-center px-[30px] text-[17.13px] font-medium uppercase leading-normal tracking-[1.9px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";
export const btnCrimson = `${btnBase} bg-crimson py-[17px] text-white hover:bg-[#b00e39] focus-visible:outline-navy`;
export const btnWhite = `${btnBase} bg-white py-[17px] text-crimson hover:bg-crimson hover:text-white focus-visible:outline-[#fd0]`;
export const btnStrokedNavy = `${btnBase} border-2 border-navy py-[15px] text-navy hover:bg-navy hover:text-white focus-visible:outline-crimson`;

/** "6 October 2026" in Pakistan time. */
export function newsDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" });
}

/** Outlined chip; filled crimson when active. */
export function Chip({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center justify-center whitespace-nowrap px-[16px] py-[10px] text-[14px] font-medium leading-[17px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
        active ? "border border-crimson bg-crimson text-white" : "border border-[#d6d6d6] text-navy hover:border-navy"
      }`}
    >
      {children}
    </Link>
  );
}

/** Uploaded media and remote images are shown as-is; files in /public go through next/image. */
export const isMedia = (src: string) => src.startsWith("/media/") || /^(https?:)?\/\//i.test(src);
