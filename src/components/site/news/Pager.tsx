import Link from "next/link";

/** Static page links: page 1 = base, page n = base/page/n. */
export default function Pager({ base, page, pages }: { base: string; page: number; pages: number }) {
  if (pages <= 1) return null;
  const href = (n: number) => (n <= 1 ? base : `${base}/page/${n}`);
  const nums: (number | "…")[] = [];
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) nums.push(n);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const box = "flex h-[48px] min-w-[48px] items-center justify-center px-[14px] text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";
  return (
    <nav aria-label="News pages" className="mt-[48px] flex justify-center lg:mt-[80px]">
      <ul className="flex flex-wrap items-center justify-center gap-[8px]">
        {page > 1 && (
          <li>
            <Link href={href(page - 1)} rel="prev" className={`${box} border border-[#d6d6d6] text-navy hover:border-navy`}>
              <span aria-hidden>←</span><span className="sr-only">Previous page</span>
            </Link>
          </li>
        )}
        {nums.map((n, i) =>
          n === "…" ? (
            <li key={`gap-${i}`} aria-hidden className="px-[6px] text-[#5c5c5c]">…</li>
          ) : (
            <li key={n}>
              <Link
                href={href(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                className={`${box} ${n === page ? "bg-navy text-white" : "border border-[#d6d6d6] text-navy hover:border-navy"}`}
              >
                {n}
              </Link>
            </li>
          ),
        )}
        {page < pages && (
          <li>
            <Link href={href(page + 1)} rel="next" className={`${box} border border-[#d6d6d6] text-navy hover:border-navy`}>
              <span aria-hidden>→</span><span className="sr-only">Next page</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
