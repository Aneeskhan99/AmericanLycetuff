import Link from "next/link";
import type { ReactNode } from "react";
import { isInternal } from "@/lib/content";

/** Renders an admin-edited link: internal → <Link>, http(s) → new tab, anything else (#anchor, tel:, mailto:) → plain <a>. */
export default function CmsLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (isInternal(href))
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  if (/^https?:\/\//i.test(href) || href.startsWith("//"))
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

/** next/image can only optimise local files; anything external is shown as-is. */
export const unoptimized = (src: string) => /^(https?:)?\/\//i.test(src);
