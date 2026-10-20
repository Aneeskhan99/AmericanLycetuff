import { definePage, f } from "@/lib/content";

const BUTTON_HINT = "Leave the label empty to hide the button.";

/** Editable content for /competitions (Figma "Competition — Desktop/Web" 518:3116, mobile 518:3229). */
export const competitionsPage = definePage({
  key: "competitions",
  title: "Competitions",
  path: "/competitions",
  sections: {
    hero: {
      label: "Hero (top of page)",
      description: "Page title, intro, the two buttons and the large photo.",
      fields: {
        eyebrow: f.text("Small label above the title", "Competitions", { max: 40 }),
        heading: f.text("Page title", "Where our students compete, achieve and shine", { max: 90 }),
        intro: f.textarea(
          "Intro text",
          "From certificate ceremonies to inter-school contests, American Lycetuff students put their learning to the test, and we celebrate every achievement along the way.",
          { rows: 3, max: 320 },
        ),
        button: f.link("First button (crimson)", { label: "View recent competitions", href: "#recent-competitions" }, { hint: BUTTON_HINT }),
        button2: f.link("Second button (outline)", { label: "Enquire now", href: "/enquire" }, { hint: BUTTON_HINT }),
        photo: f.image("Photo", {
          src: "/images/competitions/hero-certificates.jpg",
          alt: "Students holding up their certificates on the front steps under the American Lycetuff sign",
        }),
      },
    },
    categories: {
      label: "What we compete in",
      description: "Grey band with the heading and the four category cards.",
      fields: {
        eyebrow: f.text("Small label", "What we compete in", { max: 40 }),
        heading: f.text("Heading", "Competitions across every subject", { max: 80 }),
        intro: f.textarea(
          "Text",
          "Students take part in academic, STEM, creative and sports competitions, both within school and against schools across the region.",
          { rows: 3, max: 300 },
        ),
        cards: f.list(
          "Category cards",
          {
            title: f.text("Title", "", { max: 40 }),
            text: f.textarea("Text", "", { rows: 2, max: 200 }),
          },
          [
            { title: "Academic Olympiads", text: "Maths, science and English contests that reward clear thinking and strong fundamentals." },
            { title: "STEM & Robotics", text: "Projects, science fairs and robotics challenges built in our STEM labs." },
            { title: "Speech & Debate", text: "Declamations, debates and quiz contests in English and Urdu." },
            { title: "Arts & Sports", text: "Art, calligraphy, sports days and house competitions throughout the year." },
          ],
          { itemTitle: "title", max: 8, hint: "Four cards fit one row on computers." },
        ),
      },
    },
    featured: {
      label: "Featured event",
      description: "Large photo with the event details and two small photos.",
      fields: {
        eyebrow: f.text("Small label", "Featured event", { max: 40 }),
        heading: f.text("Heading", "Certificate Presentation Ceremony", { max: 80 }),
        text: f.textarea(
          "Text",
          "Competition winners from the senior and middle sections gathered on the front steps of DNK STEM School Swabi to receive their certificates from school leadership and faculty.",
          { rows: 4, max: 400 },
        ),
        photo: f.image("Large photo", {
          src: "/images/competitions/featured-ceremony.jpg",
          alt: "Competition winners holding their certificates with school leadership and faculty",
        }),
        details: f.list(
          "Details",
          {
            label: f.text("Label", "", { max: 30 }),
            value: f.text("Value", "", { max: 60 }),
          },
          [
            { label: "Venue", value: "DNK STEM School, Swabi" },
            { label: "Awarded", value: "Certificates of achievement" },
            { label: "Presented by", value: "School leadership and faculty" },
          ],
          { itemTitle: "label", max: 6 },
        ),
        thumb1: f.image("Small photo 1", {
          src: "/images/competitions/thumb-green-blazers.jpg",
          alt: "Students in green blazers gathered with their teachers outdoors",
        }),
        thumb2: f.image("Small photo 2", {
          src: "/images/competitions/thumb-front-steps.jpg",
          alt: "Award winners and teachers on the front steps of the school, with flags flying",
        }),
      },
    },
    recent: {
      label: "Recent competitions",
      description: "Navy band with the event cards. The hero's first button scrolls here.",
      fields: {
        eyebrow: f.text("Small label", "Moments of achievement", { max: 40 }),
        heading: f.text("Heading", "Recent competitions and award days", { max: 80 }),
        button: f.link("Button (outline)", { label: "Enquire about competitions", href: "/enquire" }, { hint: BUTTON_HINT }),
        cards: f.list(
          "Event cards",
          {
            label: f.text("Small label", "", { max: 30, hint: "e.g. Junior section" }),
            title: f.text("Title", "", { max: 60 }),
            text: f.textarea("Text", "", { rows: 2, max: 220 }),
            photo: f.image("Photo", { src: "", alt: "" }),
          },
          [
            {
              label: "Junior section",
              title: "Junior Achievers Award Day",
              text: "Our youngest winners received medals and certificates for their competition results.",
              photo: { src: "/images/competitions/card-junior-awards.jpg", alt: "Two trophies on a table ready for the junior award day" },
            },
            {
              label: "Middle section",
              title: "Merit Certificates Distribution",
              text: "Students were recognised with certificates of merit for their competition performance.",
              photo: { src: "/images/competitions/card-merit-certificates.jpg", alt: "Students holding up their merit certificates in the school hall" },
            },
            {
              label: "Inter-school",
              title: "Competition Visit",
              text: "Our competing students and their teachers together on an inter-school competition visit.",
              photo: { src: "/images/competitions/card-competition-visit.jpg", alt: "Students in blue caps with their teachers in front of the school building" },
            },
          ],
          { itemTitle: "title", max: 12, hint: "Three cards fit one row on computers; more start a new row." },
        ),
      },
    },
    steps: {
      label: "How students take part",
      description: "The three numbered steps.",
      fields: {
        eyebrow: f.text("Small label", "How it works", { max: 40 }),
        heading: f.text("Heading", "How students take part", { max: 80 }),
        items: f.list(
          "Steps",
          {
            step: f.text("Step label", "", { max: 20, hint: "e.g. Step 01" }),
            title: f.text("Title", "", { max: 60 }),
            text: f.textarea("Text", "", { rows: 2, max: 240 }),
          },
          [
            {
              step: "Step 01",
              title: "Register with your class teacher",
              text: "Competitions are announced in class and at assembly. Interested students sign up through their class teacher.",
            },
            {
              step: "Step 02",
              title: "Prepare with mentors",
              text: "Teachers and STEM mentors guide students through practice sessions before each competition.",
            },
            {
              step: "Step 03",
              title: "Compete and celebrate",
              text: "Results are shared with families, and winners are honoured at our certificate presentation ceremonies.",
            },
          ],
          { itemTitle: "title", max: 6 },
        ),
      },
    },
    cta: {
      label: "Call to action (bottom)",
      description: "Grey band above the newsletter with two buttons.",
      fields: {
        heading: f.text("Heading", "Give your child the stage to shine", { max: 80 }),
        text: f.textarea("Text", "Talk to our admissions team about competitions, clubs and life at American Lycetuff.", { rows: 2, max: 240 }),
        button: f.link("First button (crimson)", { label: "Enquire now", href: "/enquire" }, { hint: BUTTON_HINT }),
        button2: f.link("Second button (outline)", { label: "Book a campus visit", href: "/enquire?type=visit" }, { hint: BUTTON_HINT }),
      },
    },
  },
});
