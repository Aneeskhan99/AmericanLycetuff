import type { Metadata } from "next";
import Link from "next/link";
import AcademicCalendar from "@/components/site/events/AcademicCalendar";
import { EventCard, PastEventCard } from "@/components/site/events/EventCard";
import PageHero from "@/components/site/events/PageHero";
import { btnCrimson, btnStrokedNavy, Container, SectionIntro } from "@/components/site/events/ui";
import { eventsPage } from "@/content/events";
import { getPageContent } from "@/lib/content-server";
import { getCurrentCalendar, getPastEvents, getUpcomingEvents } from "@/lib/public/events";

/** Upcoming/past depends on today's date, so the page is rebuilt at least hourly. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Events & Calendar",
  description: "Upcoming events, term dates, holidays and exams at American Lycetuff Swabi Campus.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const [c, upcoming, past, calendar] = await Promise.all([
    getPageContent(eventsPage),
    getUpcomingEvents(),
    getPastEvents(6),
    getCurrentCalendar(),
  ]);

  return (
    <>
      <PageHero id="events-hero-title" label={c.hero.eyebrow} title={c.hero.title} intro={c.hero.intro} image={c.hero.image}>
        <a href="#upcoming" className={`${btnCrimson} w-full lg:w-auto`}>Upcoming events</a>
        <a href="#calendar" className={`${btnStrokedNavy} w-full lg:w-auto`}>Term dates</a>
      </PageHero>

      {/* Upcoming events */}
      <section id="upcoming" aria-labelledby="upcoming-title" className="scroll-mt-[120px] bg-white pb-14 pt-6 lg:pb-[120px] lg:pt-[60px]">
        <Container>
          <SectionIntro id="upcoming-title" label={c.upcoming.eyebrow} title={c.upcoming.title} intro={c.upcoming.intro} aside />
          {upcoming.length === 0 ? (
            <p className="mt-10 border-l-[6px] border-[#fd0] bg-[#f8f8f8] px-6 py-8 text-center text-[18px] leading-[28px] text-[#5c5c5c] lg:mt-[64px] lg:text-left" data-testid="no-events">
              {c.upcoming.empty}
            </p>
          ) : (
            <ul className="mt-8 grid gap-[24px] md:grid-cols-2 lg:mt-[64px] lg:grid-cols-3 lg:gap-[33px]" aria-label="Upcoming events">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <AcademicCalendar
        year={calendar.year}
        entries={calendar.entries}
        label={c.calendar.eyebrow}
        title={c.calendar.title}
        intro={c.calendar.intro}
        empty={c.calendar.empty}
      />

      {past.length > 0 && (
        <section aria-labelledby="past-title" className="bg-white py-14 lg:py-[120px]">
          <Container>
            <SectionIntro id="past-title" label={c.past.eyebrow} title={c.past.title} />
            <ul className="mt-8 grid gap-[20px] md:grid-cols-2 lg:mt-[56px] lg:grid-cols-3 lg:gap-x-[33px] lg:gap-y-[28px]" aria-label="Past events">
              {past.map((e) => (
                <li key={e.id}>
                  <PastEventCard event={e} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Notices link band */}
      <section aria-label="School notices" className="bg-navy-ink text-white">
        <div className="frame gutter py-[48px] lg:py-[64px]">
          <div className="mx-auto flex max-w-[1498px] flex-col items-center gap-[20px] text-center lg:flex-row lg:justify-between lg:text-left">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[2px] text-[#fd0]">Notices</p>
              <p className="mt-[10px] text-[24px] leading-[32px] lg:text-[32px] lg:leading-[40px]">Closures, deadlines and letters for parents</p>
            </div>
            <Link
              href="/notices"
              className="inline-flex w-full items-center justify-center whitespace-nowrap bg-white px-[30px] py-[17px] text-[17.13px] font-medium uppercase tracking-[1.9px] text-crimson transition-colors hover:bg-crimson hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fd0] lg:w-auto"
            >
              View notices
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
