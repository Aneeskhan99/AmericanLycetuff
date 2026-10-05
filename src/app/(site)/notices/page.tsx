import type { Metadata } from "next";
import Link from "next/link";
import { fmtDay } from "@/components/site/events/format";
import PageHero from "@/components/site/events/PageHero";
import { Container, Paragraphs } from "@/components/site/events/ui";
import { eventsPage } from "@/content/events";
import { getPageContent } from "@/lib/content-server";
import { humanSize } from "@/lib/media";
import { getNotices, type PublicNotice } from "@/lib/public/notices";

/** Which notices are live depends on today's date, so the page is rebuilt at least hourly. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Notices",
  description: "Notices for parents from American Lycetuff Swabi Campus: closures, deadlines, letters and forms.",
  alternates: { canonical: "/notices" },
};

const isInternal = (href: string) => href.startsWith("/") && !href.startsWith("//");

function NoticeItem({ n, expired = false }: { n: PublicNotice; expired?: boolean }) {
  const dates = n.end ? `${fmtDay(n.start)} – ${fmtDay(n.end)}` : `Posted ${fmtDay(n.start)}`;
  const ext = n.attachment?.name.split(".").pop()?.toUpperCase() ?? "FILE";
  return (
    <article className={`relative bg-white px-[24px] py-[24px] lg:px-[36px] lg:py-[32px] ${expired ? "" : "border-l-[6px] border-crimson"}`} data-testid={expired ? "expired-notice" : "live-notice"}>
      <p className="text-[13px] font-semibold uppercase leading-[20px] tracking-[1.98px] text-[#5c5c5c]">
        <time dateTime={n.start}>{dates}</time>
      </p>
      <h3 className={`mt-[8px] text-[22px] font-semibold leading-[30px] lg:text-[26px] lg:leading-[34px] ${expired ? "text-[#5c5c5c]" : "text-black"}`}>{n.title}</h3>
      {n.body && (
        <div className="mt-[10px] flex max-w-[900px] flex-col gap-[12px] text-[17px] leading-[27px] text-[#5c5c5c]">
          <Paragraphs text={n.body} />
        </div>
      )}
      {(n.link || n.attachment) && (
        <div className="mt-[18px] flex flex-col gap-[12px] sm:flex-row sm:flex-wrap sm:items-center sm:gap-[24px]">
          {n.attachment && (
            <a
              href={n.attachment.url}
              download={n.attachment.name}
              className="inline-flex items-center gap-[10px] text-[15px] font-medium text-navy hover:text-crimson"
            >
              <span className="bg-crimson px-[8px] py-[3px] text-[12px] font-semibold tracking-[1px] text-white">{ext}</span>
              <span className="underline underline-offset-4">Download {n.attachment.name}</span>
              <span className="text-[13px] text-[#9e9e9e]">({humanSize(n.attachment.size)})</span>
            </a>
          )}
          {n.link &&
            (isInternal(n.link) ? (
              <Link href={n.link} className="inline-flex items-center gap-[8px] text-[14px] font-medium uppercase tracking-[1.9px] text-crimson hover:text-navy">
                Find out more <span aria-hidden>→</span>
              </Link>
            ) : (
              <a href={n.link} rel="noopener noreferrer" target="_blank" className="inline-flex items-center gap-[8px] text-[14px] font-medium uppercase tracking-[1.9px] text-crimson hover:text-navy">
                Find out more <span aria-hidden>↗</span><span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
        </div>
      )}
    </article>
  );
}

export default async function NoticesPage() {
  const [c, { live, expired }] = await Promise.all([getPageContent(eventsPage), getNotices()]);
  const t = c.notices;

  return (
    <>
      <PageHero id="notices-hero-title" label={t.eyebrow} title={t.title} intro={t.intro} />

      <section aria-label="Current notices" className="bg-[#f8f8f8] py-14 lg:py-[96px]">
        <Container>
          {live.length === 0 ? (
            <p className="border-l-[6px] border-[#fd0] bg-white px-6 py-8 text-center text-[18px] leading-[28px] text-[#5c5c5c] lg:text-left" data-testid="no-notices">
              {t.empty}
            </p>
          ) : (
            <ul className="flex flex-col gap-[18px] lg:gap-[24px]">
              {live.map((n) => (
                <li key={n.id}>
                  <NoticeItem n={n} />
                </li>
              ))}
            </ul>
          )}

          {expired.length > 0 && (
            <details className="group mt-[40px] lg:mt-[64px]" data-testid="expired-notices">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-y border-[#d6d6d6] py-[18px] text-[14px] font-semibold uppercase tracking-[2px] text-navy marker:hidden [&::-webkit-details-marker]:hidden">
                Recently ended notices ({expired.length})
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[20px] transition-transform group-open:rotate-180" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
              </summary>
              <ul className="mt-[18px] flex flex-col gap-[12px]">
                {expired.map((n) => (
                  <li key={n.id}>
                    <NoticeItem n={n} expired />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Container>
      </section>
    </>
  );
}
