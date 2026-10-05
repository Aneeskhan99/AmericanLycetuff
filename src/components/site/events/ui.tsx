import Image from "next/image";
import type { ReactNode } from "react";
import { eyebrow, h2 } from "@/components/contact/ui";
import { plain, Rich } from "@/components/site/Rich";
import type { ImageValue } from "@/lib/content";
import { MONTHS, ymd } from "./format";

export { btnCrimson, btnStrokedNavy, eyebrow } from "@/components/contact/ui";

/** Section side padding + centred 1498px column, as on the other inner pages. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="frame gutter">
      <div className={`mx-auto w-full max-w-[1498px] ${className}`}>{children}</div>
    </div>
  );
}

/** Eyebrow + two-tone heading (crimson *highlight*) + optional intro, centred on mobile, left on desktop. */
export function SectionIntro({ id, label, title, intro, aside = false }: { id: string; label: string; title: string; intro?: string; aside?: boolean }) {
  return (
    <div className={aside ? "lg:flex lg:items-end lg:justify-between lg:gap-10" : ""}>
      <div className="text-center lg:text-left">
        <p className={`${eyebrow} text-black`}>{label}</p>
        <h2 id={id} className={`${h2} mt-[14px] text-black lg:mt-[20px]`}>
          <Rich text={title} />
        </h2>
      </div>
      {intro && (
        <p
          className={`mt-4 text-center text-[18px] leading-[28px] text-[#5c5c5c] lg:text-left lg:leading-[30px] ${
            aside ? "lg:mt-0 lg:w-[520px] lg:max-w-[40%] lg:shrink-0" : "lg:mt-6 lg:max-w-[760px]"
          }`}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

/** Navy date block (same look as the home page "key dates" cards). */
export function DateBlock({ date, size = "md", className = "" }: { date: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const { d, m, y } = ymd(date);
  const box = { sm: "w-[72px] py-[10px]", md: "w-[92px] py-[14px]", lg: "w-[150px] py-[26px]" }[size];
  const day = { sm: "text-[30px] tracking-[-1.5px]", md: "text-[42px] tracking-[-2px]", lg: "text-[72px] tracking-[-4px]" }[size];
  const mon = { sm: "text-[14px]", md: "text-[18px]", lg: "text-[28px]" }[size];
  return (
    <span className={`flex shrink-0 flex-col items-center justify-center bg-navy-deep text-center font-inter text-white ${box} ${className}`}>
      <span className={`font-bold leading-none ${day}`}>{d}</span>
      <span className={`mt-[6px] font-light uppercase leading-none ${mon}`}>{MONTHS[m - 1]}</span>
      {size === "lg" && <span className="mt-[10px] text-[14px] tracking-[2px] text-[#fd0]">{y}</span>}
      <span className="sr-only">{` ${y}`}</span>
    </span>
  );
}

const icons = {
  calendar: "M4 6h16v14H4zM4 10h16M9 3v5M15 3v5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
};

/** One line of event details with a small crimson icon. */
export function Meta({ icon, label, children }: { icon: keyof typeof icons; label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-[10px]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] size-[18px] shrink-0 text-crimson" aria-hidden>
        <path d={icons[icon]} />
      </svg>
      <span>
        <span className="sr-only">{label}: </span>
        {children}
      </span>
    </li>
  );
}

/** Photo from page content: next/image for the site's own images, a plain img for uploads. */
export function ContentImage({ image, sizes, className = "", preload = false }: { image: ImageValue; sizes: string; className?: string; preload?: boolean }) {
  if (!image.src) return null;
  if (image.src.startsWith("/images/")) {
    return <Image src={image.src} alt={plain(image.alt)} fill preload={preload} sizes={sizes} className={`object-cover ${className}`} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={image.src} alt={plain(image.alt)} className={`absolute inset-0 size-full object-cover ${className}`} />;
}

/** Splits plain text into paragraphs (blank line) and line breaks (single newline). */
export function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  const paras = text.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} className={className}>
          {p.split(/\r?\n/).map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}
