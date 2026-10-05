import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eventWhen } from "@/components/site/events/format";
import { btnCrimson, btnStrokedNavy, DateBlock, Meta, Paragraphs } from "@/components/site/events/ui";
import { getEventBySlug, getEventSlugs } from "@/lib/public/events";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getEventSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) return { title: "Event not found" };
  const w = eventWhen({ startDate: e.startDate, startTime: e.startTime || null, endDate: e.endDate, endTime: e.endTime, allDay: e.allDay });
  const summary = e.description.replace(/\s+/g, " ").trim().slice(0, 155);
  const description = summary || `${w.date}, ${w.time}${e.venue ? ` at ${e.venue}` : ""}. American Lycetuff Swabi Campus.`;
  return {
    title: e.title,
    description,
    alternates: { canonical: `/events/${e.slug}` },
    openGraph: { title: e.title, description, type: "article", ...(e.image ? { images: [{ url: e.image.url, alt: e.image.alt }] } : {}) },
  };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e) notFound();

  const w = eventWhen({ startDate: e.startDate, startTime: e.startTime || null, endDate: e.endDate, endTime: e.endTime, allDay: e.allDay });
  // "Finished" is worked out when the page is (re)built; the page is rebuilt at least hourly.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const endMs = e.allDay ? new Date(`${e.endDate ?? e.startDate}T23:59:59+05:00`).getTime() : new Date(e.endsAt ?? e.startsAt).getTime();
  const finished = endMs < now;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: e.allDay ? e.startDate : e.startsAt,
    ...(e.endsAt || e.endDate ? { endDate: e.allDay ? (e.endDate ?? e.startDate) : e.endsAt } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: e.venue || "American Lycetuff Swabi Campus", address: "Sector-E, Shahmansoor Township Swabi, Khyber Pakhtunkhwa" },
    organizer: { "@type": "EducationalOrganization", name: "American Lycetuff Swabi Campus" },
    ...(e.description ? { description: e.description.slice(0, 500) } : {}),
    ...(e.image ? { image: [e.image.url] } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <article aria-labelledby="event-title">
        <section className="bg-white">
          <div className="frame gutter pb-[56px] pt-[32px] lg:pb-[80px] lg:pt-[48px]">
            <div className="mx-auto max-w-[1498px]">
              <Link href="/events" className="inline-flex items-center gap-[8px] text-[14px] font-medium uppercase tracking-[1.9px] text-navy hover:text-crimson">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-[18px]" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                All events
              </Link>

              <div className="mt-[32px] flex flex-col items-center lg:mt-[48px] lg:flex-row lg:items-center lg:justify-between lg:gap-[40px]">
                <div className="flex w-full min-w-0 flex-col items-center text-center lg:max-w-[700px] lg:items-start lg:text-left">
                  <p className="text-[16px] font-medium uppercase leading-[25px] tracking-[1.7747px] text-crimson lg:text-[17.13px] lg:tracking-[1.9px]">
                    {finished ? "Past event" : "Event"}
                  </p>
                  <h1
                    id="event-title"
                    className="mt-[20px] text-[34px] font-bold leading-[40px] text-navy lg:mt-[26px] lg:text-[clamp(44px,3.2vw,62px)] lg:leading-[1.2]"
                  >
                    {e.title}
                  </h1>
                  <ul className="mt-[24px] flex flex-col items-start gap-[10px] text-left text-[18px] leading-[28px] text-[#5c5c5c] lg:mt-[32px] lg:text-[20px] lg:leading-[30px]">
                    <Meta icon="calendar" label="Date"><time dateTime={e.allDay ? e.startDate : e.startsAt}>{w.date}</time></Meta>
                    <Meta icon="clock" label="Time">{w.time} <span className="text-[15px] text-[#9e9e9e]">(Pakistan time)</span></Meta>
                    {e.venue && <Meta icon="pin" label="Venue">{e.venue}</Meta>}
                  </ul>
                  {finished && (
                    <p className="mt-[20px] border-l-[4px] border-[#fd0] bg-[#f8f8f8] px-[16px] py-[10px] text-[15px] text-[#5c5c5c]">This event has finished.</p>
                  )}
                  <div className="mt-[28px] flex w-full flex-col gap-[12px] lg:mt-[44px] lg:w-auto lg:flex-row lg:flex-wrap lg:gap-[20px]">
                    {!finished && (
                      <a href={`/events/${e.slug}/ics`} download={`${e.slug}.ics`} className={`${btnCrimson} w-full lg:w-auto`} data-testid="add-to-calendar">
                        Add to calendar
                      </a>
                    )}
                    <Link href="/events" className={`${btnStrokedNavy} w-full lg:w-auto`}>
                      Back to events
                    </Link>
                  </div>
                </div>

                {e.image ? (
                  <div className="relative mt-[32px] w-full lg:mt-0 lg:mr-[-20px] lg:aspect-[820/640] lg:w-[50%] lg:shrink-0">
                    <div aria-hidden className="absolute bottom-0 left-0 hidden h-[calc(100%-20px)] w-[calc(100%-20px)] bg-crimson lg:block" />
                    <div className="relative aspect-[4/3] w-full overflow-hidden border-[6px] border-[#fd0] lg:absolute lg:right-0 lg:top-0 lg:aspect-auto lg:h-[calc(100%-20px)] lg:w-[calc(100%-20px)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.image.url}
                        srcSet={e.image.srcSet || undefined}
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        alt={e.image.alt}
                        width={e.image.width ?? undefined}
                        height={e.image.height ?? undefined}
                        className="absolute inset-0 size-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-[32px] hidden lg:mt-0 lg:block">
                    <DateBlock date={e.startDate} size="lg" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {e.description && (
          <section aria-label="About this event" className="bg-[#f8f8f8]">
            <div className="frame gutter py-[48px] lg:py-[96px]">
              <div className="mx-auto max-w-[1498px]">
                <div className="flex max-w-[820px] flex-col gap-[20px] text-[18px] leading-[30px] text-[#3d3d3d] lg:text-[19px] lg:leading-[32px]">
                  <Paragraphs text={e.description} />
                </div>
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  );
}
