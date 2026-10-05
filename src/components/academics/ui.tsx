import type { ReactNode } from "react";
import { Rich } from "@/components/site/Rich";

export { CmsLink, lines, num, unoptimized } from "@/components/about/cms";

/** Small uppercase label above section headings (13.1px desktop / 13px mobile). */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`text-center text-[13px] font-semibold uppercase leading-[20px] tracking-[1.98px] text-black lg:text-left lg:text-[13.1px] lg:leading-[16px] lg:tracking-[2px] ${className}`}
    >
      {children}
    </p>
  );
}

/** Two-tone section heading: black text, *starred* words in crimson (kept on one line). */
export function SectionHeading({ text, className = "", id }: { text: string; className?: string; id?: string }) {
  return (
    <h2
      id={id}
      className={`text-center text-[32px] font-normal leading-[36px] text-black lg:text-left lg:text-[clamp(44px,2.92vw,56px)] lg:leading-[1.143] ${className}`}
    >
      <Rich text={text} hl="whitespace-nowrap text-crimson" />
    </h2>
  );
}

/** Chip / tag used across the stage rows and qualification cards. */
export function Tag({ children, variant = "light" }: { children: ReactNode; variant?: "light" | "dark" | "filled" }) {
  const styles = {
    light: "border border-[#d6d6d6] text-navy",
    dark: "border border-white/35 text-white",
    filled: "bg-crimson text-white",
  }[variant];
  return (
    <li
      className={`flex w-full items-center justify-center px-[16px] py-[13px] text-center text-[14px] font-medium leading-[17px] lg:w-auto lg:py-[10px] ${styles}`}
    >
      {children}
    </li>
  );
}

export function TagList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ul className={`flex flex-col gap-[8px] lg:flex-row lg:flex-wrap lg:gap-[10px] ${className}`}>{children}</ul>;
}

/** Container that lines content up with x=211 of the 1920 frame (1498px wide). */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="frame gutter">
      <div className={`mx-auto w-full max-w-[1498px] ${className}`}>{children}</div>
    </div>
  );
}
