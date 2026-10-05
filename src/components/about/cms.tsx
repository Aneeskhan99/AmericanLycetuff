import Link from "next/link";
import type { ReactNode } from "react";
import { isInternal } from "@/lib/content";

/** next/image only optimises local files; anything external is shown as-is. */
export const unoptimized = (src: string) => /^(https?:)?\/\//i.test(src);

/** "One per line" admin text → trimmed, non-empty lines. */
export const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

/** 0 → "01", 1 → "02", … (automatic numbering for list items). */
export const num = (i: number) => String(i + 1).padStart(2, "0");

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
      <a href={href} target="_blank" rel="noopener" className={className}>
        {children}
      </a>
    );
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
