import { definePage, f } from "@/lib/content";

/**
 * Editable content for /events (and the heading of /notices). Values here are the
 * code defaults (see src/lib/content.ts). Wrap a word in *stars* to show it in crimson.
 */
export const eventsPage = definePage({
  key: "events",
  title: "Events & Calendar (page text)",
  path: "/events",
  revalidate: ["/events", "/notices"],
  sections: {
    hero: {
      label: "Top of the page",
      fields: {
        eyebrow: f.text("Small label", "Events & Calendar", { max: 60 }),
        title: f.text("Heading", "What’s On at *Lycetuff*", { max: 120, hint: "Wrap a word in *stars* to show it in crimson." }),
        intro: f.textarea("Introduction", "Open days, sports days, exhibitions and assemblies, plus the term dates, holidays and exams for the school year. All times are Pakistan time.", { max: 400, rows: 3 }),
        image: f.image("Photo", { src: "/images/gallery/campus-cultural-dance.jpg", alt: "Students performing a cultural dance on the American Lycetuff Swabi campus" }),
      },
    },
    upcoming: {
      label: "Upcoming events",
      fields: {
        eyebrow: f.text("Small label", "Coming up", { max: 60 }),
        title: f.text("Heading", "Upcoming *Events*", { max: 120 }),
        intro: f.textarea("Introduction", "Families are welcome at most school events. Tap an event for the details and to add it to your calendar.", { max: 300, rows: 2 }),
        empty: f.text("When there are no events", "No events scheduled yet. Please check back soon.", { max: 160 }),
      },
    },
    calendar: {
      label: "Academic calendar",
      fields: {
        eyebrow: f.text("Small label", "Academic calendar", { max: 60 }),
        title: f.text("Heading", "Term Dates & *Holidays*", { max: 120 }),
        intro: f.textarea("Introduction", "Terms, holidays and examinations for the current academic year. Dates may change; any change will be announced in the notices.", { max: 300, rows: 2 }),
        empty: f.text("When no dates are published", "The academic calendar will be published here soon.", { max: 160 }),
      },
    },
    past: {
      label: "Past events",
      fields: {
        eyebrow: f.text("Small label", "Looking back", { max: 60 }),
        title: f.text("Heading", "Recent *Events*", { max: 120 }),
      },
    },
    notices: {
      label: "Notices page (/notices)",
      fields: {
        eyebrow: f.text("Small label", "Notices", { max: 60 }),
        title: f.text("Heading", "Notices for *Parents*", { max: 120 }),
        intro: f.textarea("Introduction", "Closures, deadlines and changes to the school day. Download any letters and forms below.", { max: 300, rows: 2 }),
        empty: f.text("When there are no notices", "There are no notices at the moment.", { max: 160 }),
      },
    },
  },
});
