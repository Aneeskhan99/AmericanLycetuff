import Link from "next/link";
import { Rich } from "@/components/site/Rich";
import type { AlbumCard } from "@/lib/public/gallery";
import { labelFor } from "./photos";

const pad = (n: number) => String(n).padStart(2, "0");

export function albumDate(d: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** "Photo Albums" grid near the end of /gallery (hidden when there are none). */
export default function Albums({ albums, eyebrow, heading, intro }: { albums: AlbumCard[]; eyebrow: string; heading: string; intro: string }) {
  if (!albums.length) return null;
  return (
    <section id="albums" aria-labelledby="albums-title" className="frame gutter scroll-mt-[100px] bg-[#f8f8f8]">
      <div className="mx-auto w-full max-w-[1498px] py-[56px] lg:pb-[120px] lg:pt-[110px]">
        <div className="text-center lg:grid lg:grid-cols-[889fr_609fr] lg:text-left">
          <div>
            <p className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.9847px] text-black lg:text-[13.1px] lg:leading-[16px] lg:tracking-[2px]">
              {eyebrow}
            </p>
            <h2
              id="albums-title"
              className="mt-[14px] text-[34px] leading-[38px] tracking-[-0.4722px] text-black lg:mt-[20px] lg:text-[clamp(52px,3.75vw,72px)] lg:leading-[1.111] lg:tracking-[-1px]"
            >
              <Rich text={heading} />
            </h2>
          </div>
          {intro && (
            <p className="mt-[16px] text-[18px] leading-[28px] tracking-[0.3px] text-[#5c5c5c] lg:mt-0 lg:max-w-[360px] lg:self-end lg:leading-[30px]">
              {intro}
            </p>
          )}
        </div>

        <ul className="mt-[32px] grid grid-cols-1 gap-x-[28px] gap-y-[40px] md:grid-cols-2 lg:mt-[64px] lg:grid-cols-3 lg:gap-y-[56px]">
          {albums.map((a, i) => (
            <li key={a.id}>
              <Link
                href={`/gallery/${a.slug}`}
                className="group block focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-crimson"
              >
                <span className="relative block aspect-[470/330] w-full overflow-hidden bg-navy-ink">
                  {a.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.cover.url}
                      srcSet={a.cover.srcSet || undefined}
                      sizes="(min-width: 1024px) 470px, (min-width: 768px) 50vw, 100vw"
                      alt={a.cover.alt}
                      width={a.cover.width ?? undefined}
                      height={a.cover.height ?? undefined}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  )}
                  <span className="absolute bottom-0 left-0 bg-crimson px-[14px] py-[8px] text-[13px] font-semibold uppercase leading-[16px] tracking-[2px] text-white">
                    {a.count} {a.count === 1 ? "photo" : "photos"}
                  </span>
                </span>
                <span className="mt-[20px] flex items-center justify-center gap-[20px] text-[13px] font-semibold uppercase leading-[20px] tracking-[1.98px] lg:justify-start lg:text-[13.1px] lg:tracking-[2px]">
                  <span className="text-crimson">{pad(i + 1)}</span>
                  <span className="text-navy">{a.category ? labelFor(a.category) : "Album"}</span>
                </span>
                <span className="mt-[12px] block text-center text-[24px] font-semibold leading-[30px] tracking-[-0.3px] text-black group-hover:text-crimson lg:text-left lg:text-[26px] lg:leading-[34px]">
                  {a.title}
                </span>
                {a.eventDate && (
                  <span className="mt-[6px] block text-center text-[15px] leading-[23px] text-[#5c5c5c] lg:text-left">
                    <time dateTime={a.eventDate}>{albumDate(a.eventDate)}</time>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
